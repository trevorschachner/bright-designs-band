import { Suspense } from 'react';
import { ShowCatalogHero } from '@/components/features/shows/ShowCatalogHero';
import { FilterSidebar } from '@/components/features/filters/filter-sidebar';
import { ActiveFilterChips } from '@/components/features/catalog/ActiveFilterChips';
import { CatalogSkeleton } from '@/components/features/catalog/CatalogSkeleton';
import { ShowsList, ShowsResultCount } from '@/components/features/catalog/ShowsList';
import { SHOWS_FILTER_FIELDS } from '@/lib/filters/filter-definitions';
import { SHOWS_PRESETS } from '@/lib/filters/presets';
import { parseShowsQuery, SHOWS_DEFAULT_LIMIT } from '@/lib/services/catalog';

// Dynamic (it reads searchParams); the data itself is tag-cached in lib/services/catalog.ts.

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * The show catalog, rendered on the server. The URL is the filter state:
 * `?search=&filters=&sort=&page=&limit=` (lib/filters/catalog-params.ts;
 * unknown fields are ignored). The filter controls are client islands that
 * rewrite the URL; the list below re-renders here from the new query.
 */
export default async function ShowsPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = parseShowsQuery(await searchParams);
  const sidebarProps = {
    filterFields: SHOWS_FILTER_FIELDS,
    presets: SHOWS_PRESETS,
    defaultLimit: SHOWS_DEFAULT_LIMIT,
    resultCount: (
      <Suspense fallback="Loading...">
        <ShowsResultCount filters={filters} />
      </Suspense>
    ),
  };

  return (
    <div>
      <ShowCatalogHero />

      <div className="flex min-h-screen">
        {/* Desktop sidebar. A CSS breakpoint, not a measured window width. */}
        <div className="hidden lg:block flex-shrink-0">
          <Suspense fallback={<aside className="w-80 border-r border-border bg-muted/30 h-screen" />}>
            <FilterSidebar {...sidebarProps} />
          </Suspense>
        </div>

        <div className="flex-1 min-w-0">
          <div className="container mx-auto px-4 py-8">
            <Suspense fallback={null}>
              <ActiveFilterChips filterFields={SHOWS_FILTER_FIELDS} defaultLimit={SHOWS_DEFAULT_LIMIT} />
            </Suspense>

            {/* Mobile filter button (opens the sidebar as a sheet) */}
            <div className="mb-6 lg:hidden">
              <Suspense fallback={null}>
                <FilterSidebar {...sidebarProps} isMobile />
              </Suspense>
            </div>

            <Suspense fallback={<CatalogSkeleton />}>
              <ShowsList filters={filters} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
