import { arrangements, files, showArrangements } from '@/lib/database/schema';
import { NextResponse } from 'next/server';
import { QueryBuilder, FilterUrlManager } from '@/lib/filters/query-builder';
import { count } from 'drizzle-orm/sql';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    // Lazy import DB to avoid requiring DATABASE_URL at module-eval time
    let db: any;
    try {
      ({ db } = await import('@/lib/database'));
    } catch (e) {
      console.error('Database import failed (likely no DATABASE_URL).', e);
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const filterState = FilterUrlManager.fromUrlParams(searchParams);
    
    // Default pagination
    const page = filterState.page || 1;
    const limit = filterState.limit || 20;
    const offset = (page - 1) * limit;

    // Build base query with conditional chaining
    let queryBuilder = db.select().from(arrangements);
    let countQueryBuilder = db.select({ count: count() }).from(arrangements);

    // Add WHERE conditions
    const whereConditions = [];
    
    // Add search condition (support name/title and composer)
    if (filterState.search) {
      const searchCondition = QueryBuilder.buildSearchCondition(
        arrangements,
        filterState.search,
        ['name', 'title', 'composer']
      );
      if (searchCondition) {
        whereConditions.push(searchCondition);
      }
    }

    // Add filter conditions
    if (filterState.conditions.length > 0) {
      const filterCondition = QueryBuilder.buildWhereClause(arrangements, filterState.conditions);
      if (filterCondition) {
        whereConditions.push(filterCondition);
      }
    }

    // Build final WHERE clause
    let finalWhereClause;
    if (whereConditions.length > 0) {
      finalWhereClause = whereConditions.length === 1 
        ? whereConditions[0] 
        : QueryBuilder.buildWhereClause(arrangements, filterState.conditions);
      
      if (finalWhereClause) {
        queryBuilder = queryBuilder.where(finalWhereClause) as typeof queryBuilder;
        countQueryBuilder = countQueryBuilder.where(finalWhereClause) as typeof countQueryBuilder;
      }
    }

    // Add ORDER BY
    if (filterState.sort.length > 0) {
      const orderByClause = QueryBuilder.buildOrderByClause(arrangements, filterState.sort);
      queryBuilder = queryBuilder.orderBy(...orderByClause) as typeof queryBuilder;
    } else {
      // Default sort by title
      queryBuilder = queryBuilder.orderBy(arrangements.title) as typeof queryBuilder;
    }

    // Add pagination
    const query = queryBuilder.limit(limit).offset(offset);
    const countQuery = countQueryBuilder;

    // Execute count query and optimized single query with public files relation (audio/sample score)
    const [totalResult, arrangementsWithRelations] = await Promise.all([
      countQuery,
      db.query.arrangements.findMany({
        limit,
        offset,
        where: finalWhereClause,
        orderBy: filterState.sort?.length > 0
          ? QueryBuilder.buildOrderByClause(arrangements, filterState.sort)
          : [arrangements.title],
        with: {
          files: {
            where: (files, { eq }) => eq(files.isPublic, true),
            orderBy: [files.displayOrder, files.createdAt],
          },
        },
      })
    ]);

    const total = totalResult[0]?.count || 0;

    const response = QueryBuilder.buildFilteredResponse(
      arrangementsWithRelations,
      total,
      filterState
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching arrangements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch arrangements' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  // Lazy-import supabase client; it may depend on env vars
  let createClient: any;
  try {
    ({ createClient } = await import('@/lib/utils/supabase/server'));
  } catch (e) {
    console.error('Supabase client import failed.', e);
    return NextResponse.json({ error: 'Auth provider not configured' }, { status: 500 });
  }

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { showId, displayOrder, ...rest } = body as any;
  if (!showId) {
    return NextResponse.json({ error: 'showId is required' }, { status: 400 });
  }

  // Lazy import DB only when needed
  let db: any;
  try {
    ({ db } = await import('@/lib/database'));
  } catch (e) {
    console.error('Database import failed (likely no DATABASE_URL).', e);
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  // Compute order index from join table (max + 1)
  let finalOrder: number;
  if (typeof displayOrder === 'number') {
    finalOrder = displayOrder;
  } else {
    const existing = await db
      .select({ orderIndex: showArrangements.orderIndex })
      .from(showArrangements)
      .where(eq(showArrangements.showId, Number(showId)))
      .orderBy(desc(showArrangements.orderIndex))
      .limit(1);
    finalOrder = ((existing[0]?.orderIndex as number | undefined) ?? -1) + 1;
  }

  // Create arrangement (no direct FK on arrangements table anymore)
  const inserted = await db.insert(arrangements).values({ ...rest }).returning({ id: arrangements.id });
  const newId = inserted[0]?.id;
  if (!newId) {
    return NextResponse.json({ error: 'Failed to create arrangement' }, { status: 500 });
  }

  // Link to show via join table with computed order
  await db.insert(showArrangements).values({
    showId: Number(showId),
    arrangementId: newId,
    orderIndex: finalOrder,
  });

  return NextResponse.json({ id: newId, showId: Number(showId), orderIndex: finalOrder });
}
