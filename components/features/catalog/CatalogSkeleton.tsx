import { ShowCardSkeleton } from '@/components/features/shows/ShowCard';
import { Skeleton } from '@/components/ui/skeleton';

/** Placeholder for the show grid while its page of data streams in. */
export function CatalogSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading shows">
      <div className="flex items-center justify-end mb-4">
        <Skeleton className="h-8 w-[4.5rem]" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {Array.from({ length: count }, (_, i) => (
          <ShowCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/** Placeholder for the arrangements table. */
export function ArrangementsSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading arrangements" className="space-y-2 mb-8">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}
