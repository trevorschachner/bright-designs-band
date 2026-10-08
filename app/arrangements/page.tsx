import { Suspense } from 'react';
import { FilterBar } from '@/components/features/filters/filter-bar';
import { ResaleCallout } from '@/components/features/resale-callout';
import { ArrangementsSkeleton } from '@/components/features/catalog/CatalogSkeleton';
import { ArrangementsList, ArrangementsResultCount } from '@/components/features/catalog/ArrangementsList';
import { ARRANGEMENTS_FILTER_FIELDS } from '@/lib/filters/filter-definitions';
import { ARRANGEMENTS_DEFAULT_LIMIT, parseArrangementsQuery } from '@/lib/services/catalog';

// Dynamic (it reads searchParams); the data itself is tag-cached in lib/services/catalog.ts.

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * The arrangements catalog, rendered on the server from the URL
 * (lib/filters/catalog-params.ts). FilterBar is a client island that rewrites
 * the query string; the table re-renders here.
 */
export default async function ArrangementsPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = parseArrangementsQuery(await searchParams);

  return (
    <div className="container mx-auto py-20">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-center mb-8">Arrangements</h1>

        <ResaleCallout kind="catalog" className="mb-8" />

        {/* Filter Bar (reads useSearchParams, so it has its own boundary) */}
        <Suspense fallback={<div className="h-10" />}>
          <FilterBar
            filterFields={ARRANGEMENTS_FILTER_FIELDS}
            defaultLimit={ARRANGEMENTS_DEFAULT_LIMIT}
            resultCount={
              <Suspense fallback="Loading...">
                <ArrangementsResultCount filters={filters} />
              </Suspense>
            }
          />
        </Suspense>
      </div>

      <Suspense fallback={<ArrangementsSkeleton />}>
        <ArrangementsList filters={filters} />
      </Suspense>
    </div>
  );
}
