import { shows } from '@/lib/database/schema';
import { QueryBuilder, FilterUrlManager } from '@/lib/filters/query-builder';
import { UnknownFilterFieldError } from '@/lib/filters/table-query';
import { guard } from '@/lib/auth/guard';
import { SuccessResponse, PrivateResponse, ErrorResponse, BadRequestResponse } from '@/lib/utils/api-helpers';
import { reportError } from '@/lib/observability/report-error';
import { getShowsPageForAdmin, type ShowsPageParams } from '@/lib/services/shows';
import { parseShowsQuery, queryShows } from '@/lib/services/catalog';
import { readAdminSearch } from '@/lib/filters/admin-search';

export const dynamic = 'force-dynamic';

/**
 * A page of the public catalog: the same `queryShows` the /shows page renders
 * from, so the two answer identically. Envelope unchanged:
 * `{ success, data: { data, pagination, appliedFilters } }`. Unknown filter
 * fields and operators are dropped, `limit` is capped at 48 and `search` at 80
 * characters (lib/filters/catalog-params.ts).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // The admin shows table asks with ?admin=true and must see its own writes
  // at once, so staff get an uncached read. Anyone else gets the public
  // data, but every ?admin=true answer is private: the edge must never store
  // a body under the URL the admin UI reads.
  if (searchParams.get('admin') === 'true') {
    try {
      const gate = await guard('canManageShows');
      if (gate.denied) {
        const filters = parseShowsQuery(searchParams);
        const { rows, total } = await queryShows(filters);
        return PrivateResponse(QueryBuilder.buildFilteredResponse(rows, total, filters));
      }
      // Staff keep the unparsed filters and the admin table's page sizes (up
      // to 100), so a bad field can still reach buildTableQuery: answer 400.
      const filterState = FilterUrlManager.fromUrlParams(searchParams);
      const limit = filterState.limit || 20;
      const featuredParam = searchParams.get('featured');
      const params: ShowsPageParams & { q?: string } = {
        search: filterState.search,
        // The admin table's title search. Read only here, never by the public parser.
        q: readAdminSearch(searchParams),
        conditions: filterState.conditions || [],
        sort: filterState.sort || [],
        page: filterState.page || 1,
        limit,
        featured: featuredParam && ['true', '1'].includes(featuredParam.toLowerCase()) ? true : undefined,
      };
      const { data, total } = await getShowsPageForAdmin(params);
      return PrivateResponse(QueryBuilder.buildFilteredResponse(data, total, { ...filterState, limit }));
    } catch (error) {
      if (error instanceof UnknownFilterFieldError) {
        return BadRequestResponse(`Unknown filter field: ${error.field}`);
      }
      await reportError(error, { operation: 'GET /api/shows' });
      return ErrorResponse('Failed to load shows', 500);
    }
  }

  // Public: parseShowsQuery drops unknown fields, so no filter error can
  // reach the query; a failure here is a server fault.
  try {
    const filters = parseShowsQuery(searchParams);
    const { rows, total } = await queryShows(filters);
    return SuccessResponse(QueryBuilder.buildFilteredResponse(rows, total, filters));
  } catch (error) {
    await reportError(error, { operation: 'GET /api/shows' });
    return ErrorResponse('Failed to load shows', 500);
  }
}
