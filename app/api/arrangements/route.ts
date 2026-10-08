import { arrangements } from '@/lib/database/schema';
import { NextResponse } from 'next/server';
import { QueryBuilder } from '@/lib/filters/query-builder';
import { PUBLIC_CACHE_HEADERS } from '@/lib/utils/api-helpers';
import { parseArrangementsQuery, queryArrangements } from '@/lib/services/catalog';

/**
 * A page of the arrangements catalog via `queryArrangements`, the same read
 * /arrangements renders from. Raw body (no envelope), unchanged:
 * `{ data, pagination, appliedFilters }`. Filters are parsed and bounded by
 * lib/filters/catalog-params.ts.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters = parseArrangementsQuery(searchParams);

  try {
    const { rows, total } = await queryArrangements(filters);
    const response = QueryBuilder.buildFilteredResponse(rows, total, filters);
    return NextResponse.json(response, { headers: PUBLIC_CACHE_HEADERS });
  } catch (error) {
    // parseArrangementsQuery drops unknown fields, so this is a server fault.
    console.error('Error fetching arrangements:', error);
    return NextResponse.json({ error: 'Failed to fetch arrangements' }, { status: 500 });
  }
}
