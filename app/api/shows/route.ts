import { db } from '@/lib/database';
import { shows, showsToTags, files, showArrangements, arrangements, tags } from '@/lib/database/schema';
import { createClient } from '@/lib/utils/supabase/server';
import { NextResponse } from 'next/server';
import { QueryBuilder, FilterUrlManager } from '@/lib/filters/query-builder';
import { count, eq, and, inArray } from 'drizzle-orm';
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

    // Split conditions: base (shows table) vs derived (ensembleSize, featured)
    const derivedFields = new Set(['ensembleSize', 'featured']);
    const baseConditions = filterState.conditions.filter((c: any) => !derivedFields.has(String(c.field)));
    const derivedConditions = filterState.conditions.filter((c: any) => derivedFields.has(String(c.field)));

    const whereClause = QueryBuilder.buildWhereClause(shows, baseConditions);
    const orderByClause = filterState.sort.length > 0 
      ? QueryBuilder.buildOrderByClause(shows, filterState.sort)
      : [shows.createdAt];

    // Handle derived filters by precomputing allowed show IDs
    let showIdFilter: number[] | undefined;
    for (const cond of derivedConditions) {
      if (cond.field === 'ensembleSize' && cond.value) {
        const size = String(cond.value);
        const rows = await db
          .select({ showId: showArrangements.showId })
          .from(showArrangements)
          .innerJoin(arrangements, eq(showArrangements.arrangementId, arrangements.id))
          .where(eq(arrangements.ensembleSize, size as any));
        const ids = Array.from(new Set(rows.map(r => r.showId)));
        showIdFilter = showIdFilter ? showIdFilter.filter(id => ids.includes(id)) : ids;
      }
      if (cond.field === 'featured' && cond.value === true) {
        const rows = await db
          .select({ showId: showsToTags.showId })
          .from(showsToTags)
          .innerJoin(tags, eq(showsToTags.tagId, tags.id))
          .where(eq(tags.name, 'featured'));
        const ids = Array.from(new Set(rows.map(r => r.showId)));
        showIdFilter = showIdFilter ? showIdFilter.filter(id => ids.includes(id)) : ids;
      }
    }

    let computedWhere: any = whereClause as any;
    if (Array.isArray(showIdFilter)) {
      if (showIdFilter.length === 0) {
        computedWhere = eq(shows.id, -1);
      } else {
        const idCondition = inArray(shows.id, showIdFilter);
        computedWhere = computedWhere ? and(computedWhere, idCondition) : idCondition;
      }
    }

    const [totalResult, showsWithRelations] = await Promise.all([
      db.select({ count: count() }).from(shows).where(computedWhere as any),
      db.query.shows.findMany({
        limit,
        offset,
        where: computedWhere as any,
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
        name: (showData as any).name ?? (showData as any).title,
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