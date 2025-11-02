import { db } from '@/lib/database';
import { shows, showsToTags, files, showArrangements } from '@/lib/database/schema';
import { createClient } from '@/lib/utils/supabase/server';
import { NextResponse } from 'next/server';
import { QueryBuilder, FilterUrlManager } from '@/lib/filters/query-builder';
import { count } from 'drizzle-orm';
import { requirePermission } from '@/lib/auth/roles';
import { showSchema } from '@/lib/validation/shows';
import { SuccessResponse, ErrorResponse, UnauthorizedResponse, ForbiddenResponse, BadRequestResponse } from '@/lib/utils/api-helpers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filterState = FilterUrlManager.fromUrlParams(searchParams);
    
    const page = filterState.page || 1;
    const limit = filterState.limit || 20;
    const offset = (page - 1) * limit;

    const whereClause = QueryBuilder.buildWhereClause(shows, filterState.conditions);
    const orderByClause = filterState.sort.length > 0 
      ? QueryBuilder.buildOrderByClause(shows, filterState.sort)
      : [shows.createdAt];

    const [totalResult, showsWithRelations] = await Promise.all([
      db.select({ count: count() }).from(shows).where(whereClause),
      db.query.shows.findMany({
        limit,
        offset,
        where: whereClause,
        orderBy: orderByClause,
        with: {
          showsToTags: {
            with: {
              tag: true,
            },
          },
          showArrangements: {
            orderBy: [showArrangements.orderIndex],
            with: {
              arrangement: true,
            },
          },
          files: {
            where: (files, { eq }) => eq(files.isPublic, true),
            orderBy: [files.displayOrder, files.createdAt],
          },
        },
      })
    ]);

    const total = totalResult[0]?.count || 0;

    // Normalize shape: expose `arrangements` array directly for consumers
    const normalizedShows = (showsWithRelations as any[]).map((s) => {
      const { showArrangements: sa = [], ...rest } = s as any;
      const arrangements = (sa as any[]).map((item) => item.arrangement).filter(Boolean);
      return { ...rest, arrangements };
    });

    const response = QueryBuilder.buildFilteredResponse(
      normalizedShows,
      total,
      filterState
    );

    return SuccessResponse(response);
  } catch (error) {
    console.error('Error fetching shows:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    const errorDetails = process.env.NODE_ENV === 'development' 
      ? { message: error instanceof Error ? error.message : 'Unknown error', stack: error instanceof Error ? error.stack : 'No stack' }
      : undefined;
    return ErrorResponse('Failed to fetch shows', 500, errorDetails);
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return UnauthorizedResponse();
  }

  if (!requirePermission(session.user.email, 'canManageShows')) {
    return ForbiddenResponse();
  }

  try {
    const body = await request.json();
    const parsedData = showSchema.safeParse(body);

    if (!parsedData.success) {
      return BadRequestResponse(parsedData.error.errors);
    }

    const { tags: tagIds, ...showData } = parsedData.data;
    const newShow = await db.transaction(async (tx) => {
      const [inserted] = await tx.insert(shows).values({
        ...showData,
        price: showData.price?.toString()
      }).returning();

      if (tagIds && tagIds.length > 0) {
        await tx.insert(showsToTags).values(
          tagIds.map((tagId: number) => ({
            showId: inserted.id,
            tagId,
          }))
        );
      }

      return inserted;
    });

    return SuccessResponse(newShow, 201);
  } catch (error) {
    console.error('Error creating show:', error);
    return ErrorResponse('Failed to create show');
  }
} 