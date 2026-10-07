import { shows, showsToTags } from '@/lib/database/schema';
import { QueryBuilder, FilterUrlManager } from '@/lib/filters/query-builder';
import { UnknownFilterFieldError } from '@/lib/filters/table-query';
import { eq } from 'drizzle-orm';
import { guard } from '@/lib/auth/guard';
import { showSchema } from '@/lib/validation/shows';
import { SuccessResponse, PrivateResponse, ErrorResponse, BadRequestResponse } from '@/lib/utils/api-helpers';
import { reportError } from '@/lib/observability/report-error';
import { getShowsPageForAdmin, type ShowsPageParams } from '@/lib/services/shows';
import { parseShowsQuery, queryShows } from '@/lib/services/catalog';
import { invalidateShow } from '@/lib/services/invalidate';

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

  try {
    // The admin shows table asks with ?admin=true and must see its own writes
    // at once, so staff get an uncached read. Anyone else gets the public
    // data, but every ?admin=true answer is private: the edge must never store
    // a body under the URL the admin UI reads.
    if (searchParams.get('admin') === 'true') {
      const gate = await guard('canManageShows');
      if (gate.denied) {
        const filters = parseShowsQuery(searchParams);
        const { rows, total } = await queryShows(filters);
        return PrivateResponse(QueryBuilder.buildFilteredResponse(rows, total, filters));
      }
      // Staff keep the unbounded page sizes the admin table offers (up to 100).
      const filterState = FilterUrlManager.fromUrlParams(searchParams);
      const limit = filterState.limit || 20;
      const featuredParam = searchParams.get('featured');
      const params: ShowsPageParams = {
        search: filterState.search,
        conditions: filterState.conditions || [],
        sort: filterState.sort || [],
        page: filterState.page || 1,
        limit,
        featured: featuredParam && ['true', '1'].includes(featuredParam.toLowerCase()) ? true : undefined,
      };
      const { data, total } = await getShowsPageForAdmin(params);
      return PrivateResponse(QueryBuilder.buildFilteredResponse(data, total, { ...filterState, limit }));
    }

    const filters = parseShowsQuery(searchParams);
    const { rows, total } = await queryShows(filters);
    return SuccessResponse(QueryBuilder.buildFilteredResponse(rows, total, filters));
  } catch (error) {
    // A filter naming something the table does not have is the caller's
    // mistake. It used to fall into the branch below and come back as an empty
    // 200, so a broken filter was indistinguishable from a genuine no-match.
    if (error instanceof UnknownFilterFieldError) {
      return BadRequestResponse(`Unknown filter field: ${error.field}`);
    }
    await reportError(error, { operation: 'GET /api/shows' });
    return ErrorResponse('Failed to load shows', 500);
  }
}

export async function POST(request: Request) {
  const gate = await guard('canManageShows');
  if (gate.denied) return gate.denied;

  try {
    const body = await request.json();
    const parsedData = showSchema.safeParse(body);

    if (!parsedData.success) {
      return BadRequestResponse(parsedData.error.errors);
    }

    const { tags: tagIds, ...showData } = parsedData.data;
    const { db } = await import('@/lib/database');

    const generateSlug = (title: string) =>
      title.toLowerCase().trim()
        .replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
        .replace(/-+/g, '-').replace(/^-+|-+$/g, '');

    let slug = generateSlug(showData.title);
    let suffix = 1;
    while (await db.query.shows.findFirst({ where: eq(shows.slug, slug), columns: { id: true } })) {
      slug = `${generateSlug(showData.title)}-${suffix++}`;
    }

    const [inserted] = await db.insert(shows).values({
      title: showData.title,
      slug,
      year: showData.year ?? null,
      difficulty: showData.difficulty ?? null,
      duration: showData.duration ?? null,
      description: showData.description ?? null,
      price: showData.price ?? null,
      thumbnailUrl: showData.thumbnailUrl ?? null,
      videoUrl: showData.videoUrl ?? null,
      displayOrder: showData.displayOrder ?? 0,
    }).returning();

    if (Array.isArray(tagIds) && tagIds.length > 0) {
      await db.insert(showsToTags).values(
        tagIds.map((tagId: number) => ({ showId: inserted.id, tagId }))
      ).onConflictDoNothing();
    }

    invalidateShow(inserted.id, inserted.slug);
    return SuccessResponse(inserted, 201);
  } catch (error) {
    console.error('Error creating show:', error);
    return ErrorResponse('Failed to create show');
  }
}