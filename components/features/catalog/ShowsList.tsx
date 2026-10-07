import Link from 'next/link';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/features/filters/pagination';
import type { ShowCardItem } from '@/components/features/shows/ShowCard';
import { CATALOG_LIMIT_OPTIONS, catalogHref } from '@/lib/filters/catalog-params';
import { queryShows, SHOWS_DEFAULT_LIMIT, type CatalogFilters, type CatalogPage } from '@/lib/services/catalog';
import type { ShowListItem } from '@/lib/services/shows';
import { PATHS } from '@/lib/cache-tags';
import { ShowResults } from './ShowResults';

/** What a card renders and nothing more: the RSC payload carries this per show, not the whole row. */
function toCardItem(show: ShowListItem): ShowCardItem {
  return {
    id: show.id,
    slug: show.slug,
    title: show.title,
    description: show.description,
    year: show.year,
    difficulty: show.difficulty,
    duration: show.duration,
    thumbnailUrl: show.thumbnailUrl,
    graphicUrl: show.graphicUrl,
    showsToTags: show.showsToTags,
    arrangements: show.arrangements.map(({ id, title, scene }) => ({ id, title, scene })),
  };
}

export function paginationFor(page: CatalogPage<unknown>) {
  return {
    page: page.page,
    limit: page.pageSize,
    total: page.total,
    totalPages: page.totalPages,
    hasNext: page.page < page.totalPages,
    hasPrev: page.page > 1,
  };
}

/**
 * One page of the show catalog, rendered on the server from the URL's
 * filters. Async: the page renders it inside <Suspense> so the hero and
 * sidebar stream first.
 */
export async function ShowsList({ filters }: { filters: CatalogFilters }) {
  const page = await queryShows(filters);
  const items = page.rows.map(toCardItem);

  return (
    <>
      <ShowResults items={items} prioritizeFirst={page.page === 1} />

      {items.length === 0 && (
        <div className="text-center py-20">
          <div className="text-muted-foreground mb-4">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No shows found</h3>
            <p>Try adjusting your filters or search terms.</p>
          </div>
          <Button asChild>
            <Link href={PATHS.shows}>Clear All Filters</Link>
          </Button>
        </div>
      )}

      {items.length > 0 && (
        <Pagination
          pagination={paginationFor(page)}
          hrefForPage={(p) => catalogHref(PATHS.shows, { ...filters, page: p }, SHOWS_DEFAULT_LIMIT)}
          limitOptions={CATALOG_LIMIT_OPTIONS}
          defaultLimit={SHOWS_DEFAULT_LIMIT}
        />
      )}
    </>
  );
}

/** "N results found", for the sidebar. Shares the list's read (React cache). */
export async function ShowsResultCount({ filters }: { filters: CatalogFilters }) {
  const { total } = await queryShows(filters);
  return <>{`${total} result${total !== 1 ? 's' : ''} found`}</>;
}
