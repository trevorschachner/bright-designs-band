import { Suspense, type ReactNode } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PaginationInfo } from '@/lib/filters/types';
import { LimitSelect } from './limit-select';

interface PaginationProps {
  pagination: PaginationInfo;
  /** Href of a given page, filters included. Pages are plain links. */
  hrefForPage: (page: number) => string;
  /** Page sizes offered by the "Show:" select. */
  limitOptions: readonly number[];
  defaultLimit: number;
}

/**
 * Server-rendered pagination. Every page is a real <Link> carrying the current
 * filters in its query string (`?page=`), so it prefetches, works without
 * JavaScript and is crawlable. Only the page-size select is a client island.
 */
export function Pagination({
  pagination,
  hrefForPage,
  limitOptions,
  defaultLimit,
}: PaginationProps) {
  const { page, limit, total, totalPages, hasNext, hasPrev } = pagination;

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if we have few enough
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Calculate start and end of middle range
      let start = Math.max(2, page - 1);
      let end = Math.min(totalPages - 1, page + 1);
      
      // Adjust range to always show maxVisiblePages - 2 (excluding first and last)
      const middleCount = end - start + 1;
      const targetMiddleCount = maxVisiblePages - 2;
      
      if (middleCount < targetMiddleCount) {
        if (start === 2) {
          end = Math.min(totalPages - 1, start + targetMiddleCount - 1);
        } else if (end === totalPages - 1) {
          start = Math.max(2, end - targetMiddleCount + 1);
        }
      }
      
      // Add ellipsis before middle range if needed
      if (start > 2) {
        pages.push('ellipsis');
      }
      
      // Add middle range
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Add ellipsis after middle range if needed
      if (end < totalPages - 1) {
        pages.push('ellipsis');
      }
      
      // Always show last page (if we have more than 1 page)
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  const startResult = (page - 1) * limit + 1;
  const endResult = Math.min(page * limit, total);

  if (total === 0) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
      {/* Results Info */}
      <div className="text-sm text-muted-foreground">
        Showing {startResult} to {endResult} of {total} results
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-2">
        {/* Items per page */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show:</span>
          {/* Reads useSearchParams: its own boundary keeps the page from bailing out. */}
          <Suspense fallback={null}>
            <LimitSelect limit={limit} options={limitOptions} defaultLimit={defaultLimit} />
          </Suspense>
        </div>

        {/* Page Navigation */}
        <div className="flex items-center gap-1">
          {/* Previous Button */}
          <PageLink href={hasPrev ? hrefForPage(page - 1) : undefined} label="Previous page">
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </PageLink>

          {/* Page Numbers */}
          {pageNumbers.map((pageNum, index) => {
            if (pageNum === 'ellipsis') {
              return (
                <div key={`ellipsis-${index}`} className="px-2">
                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                </div>
              );
            }

            return (
              <Button
                key={pageNum}
                variant={pageNum === page ? 'default' : 'outline'}
                size="sm"
                className="min-w-[2.5rem]"
                asChild
              >
                <Link
                  href={hrefForPage(pageNum)}
                  aria-current={pageNum === page ? 'page' : undefined}
                >
                  {pageNum}
                </Link>
              </Button>
            );
          })}

          {/* Next Button */}
          <PageLink href={hasNext ? hrefForPage(page + 1) : undefined} label="Next page">
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </PageLink>
        </div>
      </div>
    </div>
  );
}

/** Previous/next: a link when there is somewhere to go, a disabled button otherwise. */
function PageLink({ href, label, children }: { href?: string; label: string; children: ReactNode }) {
  if (!href) {
    return (
      <Button variant="outline" size="sm" disabled aria-label={label}>
        {children}
      </Button>
    );
  }
  return (
    <Button variant="outline" size="sm" asChild>
      <Link href={href} aria-label={label}>
        {children}
      </Link>
    </Button>
  );
}
