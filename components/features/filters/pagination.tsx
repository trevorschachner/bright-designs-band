'use client';

import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { PaginationInfo } from '@/lib/filters/types';

interface PaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  isLoading?: boolean;
}

export function Pagination({
  pagination,
  onPageChange,
  onLimitChange,
  isLoading = false
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
          <Select 
            value={limit.toString()} 
            onValueChange={(value) => onLimitChange(parseInt(value, 10))}
            disabled={isLoading}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Page Navigation */}
        <div className="flex items-center gap-1">
          {/* Previous Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={!hasPrev || isLoading}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

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
                onClick={() => onPageChange(pageNum)}
                disabled={isLoading}
                className="min-w-[2.5rem]"
              >
                {pageNum}
              </Button>
            );
          })}

          {/* Next Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={!hasNext || isLoading}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}