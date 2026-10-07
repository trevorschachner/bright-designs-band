'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/** AdminTable's footer: entry count, page size and page navigation. */
export function AdminTablePagination({
  page,
  limit,
  total,
  totalPages,
  shown,
  loading,
  onPageChange,
  onLimitChange,
}: {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  shown: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}) {
  const goTo = (next: number) => {
    if (next >= 1 && next <= totalPages) onPageChange(next);
  };
  return (
    <>
            {shown > 0 && (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 border-t bg-muted/30 min-h-[60px]">
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Showing {shown > 0 ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, total || shown)} of {total || shown} entries
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show:</span>
            <Select
              value={limit.toString()}
              onValueChange={(value) => onLimitChange(parseInt(value, 10))}
            >
              <SelectTrigger className="w-20 h-8">
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
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goTo(1)}
            disabled={page <= 1 || loading}
            title="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
            <span className="sr-only">First</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goTo(page - 1)}
            disabled={page <= 1 || loading}
            title="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous</span>
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Page</span>
            <Input
              type="number"
              min={1}
              max={totalPages || 1}
              value={page}
              onChange={(e) => { const value = parseInt(e.target.value, 10); if (!isNaN(value) && value >= 1 && value <= totalPages) goTo(value); }}
              onBlur={(e) => {
                const value = parseInt(e.target.value, 10);
                if (isNaN(value) || value < 1) {
                  e.target.value = '1';
                  goTo(1);
                } else if (value > totalPages) {
                  e.target.value = totalPages.toString();
                  goTo(totalPages);
                }
              }}
              className="w-16 h-8 text-center"
            />
            <span className="text-sm text-muted-foreground">of {totalPages || 1}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goTo(page + 1)}
            disabled={page >= totalPages || loading}
            title="Next page"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goTo(totalPages || 1)}
            disabled={page >= totalPages || loading}
            title="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
            <span className="sr-only">Last</span>
          </Button>
        </div>
      </div>
      )}
    </>
  );
}
