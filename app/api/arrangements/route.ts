import { db } from '@/lib/db';
import { arrangements } from '@/lib/db/schema';
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { QueryBuilder, FilterUrlManager } from '@/lib/filters/query-builder';
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
    let query = db.select().from(arrangements);
    let countQuery = db.select({ count: count() }).from(arrangements);

    // Add WHERE conditions
    const whereConditions = [];
    
    // Add search condition
    if (filterState.search) {
      const searchCondition = QueryBuilder.buildSearchCondition(
        arrangements,
        filterState.search,
        ['title', 'type']
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

    // Apply WHERE clause if we have conditions
    if (whereConditions.length > 0) {
      const finalWhereClause = whereConditions.length === 1 
        ? whereConditions[0] 
        : QueryBuilder.buildWhereClause(arrangements, filterState.conditions);
      
      if (finalWhereClause) {
        query = query.where(finalWhereClause);
        countQuery = countQuery.where(finalWhereClause);
      }
    }

    // Add ORDER BY
    if (filterState.sort.length > 0) {
      const orderByClause = QueryBuilder.buildOrderByClause(arrangements, filterState.sort);
      query = query.orderBy(...orderByClause);
    } else {
      // Default sort by title
      query = query.orderBy(arrangements.title);
    }

    // Add pagination
    query = query.limit(limit).offset(offset);

    // Execute queries
    const [arrangementsData, totalResult] = await Promise.all([
      query,
      countQuery
    ]);

    const total = totalResult[0]?.count || 0;

    // Fetch arrangements with show relations
    const arrangementsWithRelations = await Promise.all(
      arrangementsData.map(async (arrangement) => {
        const arrangementWithShow = await db.query.arrangements.findFirst({
          where: (arrangements, { eq }) => eq(arrangements.id, arrangement.id),
          with: {
            show: true,
          },
        });
        return arrangementWithShow || arrangement;
      })
    );

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
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const newArrangement = await db.insert(arrangements).values(body).returning();
  return NextResponse.json(newArrangement);
} 