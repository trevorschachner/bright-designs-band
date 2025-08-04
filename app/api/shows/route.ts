import { db } from '@/lib/db';
import { shows, showsToTags, tags } from '@/lib/db/schema';
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { QueryBuilder, FilterUrlManager } from '@/lib/filters/query-builder';
import { SHOWS_FILTER_FIELDS } from '@/lib/filters/schema-analyzer';
import { count } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filterState = FilterUrlManager.fromUrlParams(searchParams);
    
    // Default pagination
    const page = filterState.page || 1;
    const limit = filterState.limit || 20;
    const offset = (page - 1) * limit;

    // Build base query
    let query = db.select().from(shows);
    let countQuery = db.select({ count: count() }).from(shows);

    // Add WHERE conditions
    const whereConditions = [];
    
    // Add search condition
    if (filterState.search) {
      const searchCondition = QueryBuilder.buildSearchCondition(
        shows,
        filterState.search,
        ['title', 'description', 'year']
      );
      if (searchCondition) {
        whereConditions.push(searchCondition);
      }
    }

    // Add filter conditions
    if (filterState.conditions.length > 0) {
      const filterCondition = QueryBuilder.buildWhereClause(shows, filterState.conditions);
      if (filterCondition) {
        whereConditions.push(filterCondition);
      }
    }

    // Apply WHERE clause if we have conditions
    if (whereConditions.length > 0) {
      const finalWhereClause = whereConditions.length === 1 
        ? whereConditions[0] 
        : QueryBuilder.buildWhereClause(shows, filterState.conditions);
      
      if (finalWhereClause) {
        query = query.where(finalWhereClause);
        countQuery = countQuery.where(finalWhereClause);
      }
    }

    // Add ORDER BY
    if (filterState.sort.length > 0) {
      const orderByClause = QueryBuilder.buildOrderByClause(shows, filterState.sort);
      query = query.orderBy(...orderByClause);
    } else {
      // Default sort by createdAt desc
      query = query.orderBy(shows.createdAt);
    }

    // Add pagination
    query = query.limit(limit).offset(offset);

    // Execute queries
    const [showsData, totalResult] = await Promise.all([
      query,
      countQuery
    ]);

    const total = totalResult[0]?.count || 0;

    // If we need relations, fetch them separately for the returned shows
    const showsWithRelations = await Promise.all(
      showsData.map(async (show) => {
        const showWithTags = await db.query.shows.findFirst({
          where: (shows, { eq }) => eq(shows.id, show.id),
          with: {
            showsToTags: {
              with: {
                tag: true,
              },
            },
            arrangements: true,
          },
        });
        return showWithTags || show;
      })
    );

    const response = QueryBuilder.buildFilteredResponse(
      showsWithRelations,
      total,
      filterState
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching shows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shows' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { tags: tagIds, ...showData } = body;

  const newShow = await db.transaction(async (tx) => {
    const [inserted] = await tx.insert(shows).values(showData).returning();

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

  return NextResponse.json(newShow);
} 