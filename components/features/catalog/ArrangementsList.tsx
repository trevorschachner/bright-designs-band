import Link from 'next/link';
import { Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/features/filters/pagination';
import { CATALOG_LIMIT_OPTIONS, catalogHref } from '@/lib/filters/catalog-params';
import { ARRANGEMENTS_DEFAULT_LIMIT, queryArrangements, type CatalogFilters } from '@/lib/services/catalog';
import { PATHS } from '@/lib/cache-tags';
import { ArrangementResults } from './ArrangementResults';
import { paginationFor } from './ShowsList';

/** One page of arrangements, rendered on the server from the URL's filters. */
export async function ArrangementsList({ filters }: { filters: CatalogFilters }) {
  const page = await queryArrangements(filters);

  return (
    <>
      <ArrangementResults items={page.rows} />

      {page.rows.length === 0 && (
        <div className="text-center py-20">
          <div className="text-muted-foreground mb-4">
            <Music className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No arrangements found</h3>
            <p>Try adjusting your filters or search terms.</p>
          </div>
          <Button asChild>
            <Link href={PATHS.arrangements}>Clear All Filters</Link>
          </Button>
        </div>
      )}

      {page.rows.length > 0 && (
        <Pagination
          pagination={paginationFor(page)}
          hrefForPage={(p) => catalogHref(PATHS.arrangements, { ...filters, page: p }, ARRANGEMENTS_DEFAULT_LIMIT)}
          limitOptions={CATALOG_LIMIT_OPTIONS}
          defaultLimit={ARRANGEMENTS_DEFAULT_LIMIT}
        />
      )}
    </>
  );
}

/** "N results found" for the filter bar. Shares the list's read (React cache). */
export async function ArrangementsResultCount({ filters }: { filters: CatalogFilters }) {
  const { total } = await queryArrangements(filters);
  return <>{`${total} result${total !== 1 ? 's' : ''} found`}</>;
}
