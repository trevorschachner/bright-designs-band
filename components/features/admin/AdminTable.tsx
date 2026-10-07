'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from 'lucide-react';
import type { ActionError, ActionResult } from '@/lib/actions/result';
import { buildListUrl, nextSort, type TableSort } from './admin-table-urls';
import { AdminTablePagination } from './AdminTablePagination';
import { AdminTableToolbar } from './AdminTableToolbar';

const DELETE_ERRORS: Record<ActionError, string> = {
  forbidden: 'You do not have permission to delete this.',
  invalid: 'Delete failed. Try again.',
  not_found: 'Already deleted.',
  conflict: 'This is still in use and cannot be deleted.',
  stale: 'Delete failed. Try again.',
  failed: 'Delete failed. Try again.',
};

/** Edit links use the slug when the row has one (shows), else the id. */
const rowKey = (row: { id: number; slug?: unknown }) => (typeof row.slug === 'string' ? row.slug : row.id);

export interface ColumnDef<T> {
  header: string;
  accessorKey: keyof T;
  cell?: (row: T) => React.ReactNode;
  /** Header click sorts by this column on the server. The endpoint must accept `sort=[...]`. */
  sortable?: boolean;
}

interface AdminTableProps<T> {
  /** List endpoint (a public GET with `?admin=true` / `?all=true`); it must accept `q` (title search). */
  endpoint: string;
  /** Deletes one row: a Server Action (e.g. `deleteShow`). `not_found` counts as done. */
  onDelete: (id: number) => Promise<ActionResult<unknown>>;
  /** Fixed query string for list requests only, e.g. "all=true". */
  listQuery?: string;
  columns: ColumnDef<T>[];
  resourceName: string;
}

export default function AdminTable<T extends { id: number }>({
  endpoint,
  listQuery,
  columns,
  resourceName,
  onDelete,
}: AdminTableProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sort, setSort] = useState<TableSort | null>(null);
  const [query, setQuery] = useState('');
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const fetchData = useCallback(async (page: number, limit: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const url = buildListUrl(endpoint, listQuery, page, limit, sort, query);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${resourceName}: ${response.statusText}`);
      }
      const result = await response.json();
      
      // Handle different response structures
      // Response structure: { success: true, data: { data: [...], pagination: {...} } }
      const responseData = result?.data;
      
      if (responseData?.pagination) {
        // New structure with pagination info
        setData((responseData.data || []) as T[]);
        setPagination(prev => ({
          ...prev,
          // Only update total and totalPages, not page/limit (they're controlled by user actions)
          total: responseData.pagination.total || 0,
          totalPages: responseData.pagination.totalPages || 1,
        }));
      } else if (responseData) {
        // Fallback for older/simpler endpoints
        const payload = responseData;
        const rows =
          Array.isArray(payload?.shows) ? payload.shows :
          Array.isArray(payload?.data) ? payload.data :
          Array.isArray(payload) ? payload : [];
        setData(rows as T[]);
        
        // Calculate total and totalPages based on rows returned
        // If we received fewer items than limit, this is the last page
        if (rows.length < limit) {
          // Last page: total = items on previous pages + items on this page
          const calculatedTotal = (page - 1) * limit + rows.length;
          setPagination(prev => ({
            ...prev,
            // Only update total and totalPages, not page/limit
            total: calculatedTotal,
            totalPages: page,
          }));
        } else {
          // Not the last page: we know there are at least (page * limit) items
          // Set total to a minimum estimate, but we don't know the exact total
          const minTotal = page * limit;
          setPagination(prev => ({
            ...prev,
            // Only update total and totalPages, not page/limit
            total: Math.max(prev.total, minTotal), // Keep existing total if higher, otherwise use minimum
            totalPages: Math.max(prev.totalPages, page + 1), // At least one more page exists
          }));
        }
      } else {
        // No data in response
        setData([]);
        setPagination(prev => ({
          ...prev,
          // Only update total and totalPages, not page/limit
          total: 0,
          totalPages: 1,
        }));
      }
    } catch (e) {
      console.error('[AdminTable] Fetch error:', e);
      setError(e instanceof Error ? e.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [endpoint, listQuery, resourceName, sort, query]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- TODO(#59-followup): fetch-on-change sets loading synchronously; moving it changes when the spinner shows
    fetchData(pagination.page, pagination.limit);
  }, [fetchData, pagination.page, pagination.limit]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const handleSort = (field: string) => {
    setSort(current => nextSort(current, field));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const renderHeaders = () =>
    columns.map((column) => {
      const field = String(column.accessorKey);
      if (!column.sortable) {
        return <TableHead key={field}>{column.header}</TableHead>;
      }
      const direction = sort?.field === field ? sort.direction : null;
      const Icon = direction === 'asc' ? ArrowUp : direction === 'desc' ? ArrowDown : ArrowUpDown;
      return (
        <TableHead
          key={field}
          aria-sort={direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : 'none'}
        >
          <button
            type="button"
            onClick={() => handleSort(field)}
            className="inline-flex items-center gap-1 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
          >
            {column.header}
            <Icon className={`h-3.5 w-3.5 ${direction ? 'text-foreground' : 'opacity-40'}`} aria-hidden />
          </button>
        </TableHead>
      );
    });

  const handleLimitChange = (newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const handleDelete = async (id: number) => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const result = await onDelete(id);
      if (!result.ok && result.error !== 'not_found') {
        setDeleteError(DELETE_ERRORS[result.error]);
        return;
      }
      setDeletingId(null);
      await fetchData(pagination.page, pagination.limit);
    } catch {
      setDeleteError(DELETE_ERRORS.failed);
    } finally {
      setIsDeleting(false);
    }
  };

  const toolbar = <AdminTableToolbar resourceName={resourceName} onSearch={handleSearch} />;

  if (loading) {
    return (
      <div>
      {toolbar}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              {renderHeaders()}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(3)].map((_, i) => (
              <TableRow key={i}>
                {columns.map((column) => (
                  <TableCell key={String(column.accessorKey)}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
                <TableCell>
                  <Skeleton className="h-8 w-16" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      </div>
    );
  }

  if (error) {
    return <div>{toolbar}<p className="text-red-500">{error}</p></div>;
  }

  if (data.length === 0) {
    return <div>{toolbar}<p>No {resourceName} found{query ? ` matching “${query}”` : ''}.</p></div>;
  }

  return (
    <div>
    {toolbar}
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            {renderHeaders()}
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              {columns.map((column) => (
                <TableCell key={String(column.accessorKey)}>
                  {column.cell ? column.cell(row) : String(row[column.accessorKey] ?? '')}
                </TableCell>
              ))}
              <TableCell>
                <div className="flex items-center gap-2">
                  <Link href={`/admin/${resourceName.toLowerCase()}/${rowKey(row)}`}>
                    <Button variant="outline" size="sm">Edit</Button>
                  </Link>
                  
                  <AlertDialog open={deletingId === row.id} onOpenChange={(open) => { setDeleteError(null); setDeletingId(open ? row.id : null); }}>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="w-8 h-8 p-0">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete this {resourceName.slice(0, -1)} and remove it from our servers.
                        </AlertDialogDescription>
                        {deleteError && <p className="text-sm text-destructive" role="alert">{deleteError}</p>}
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={(e) => {
                            e.preventDefault();
                            handleDelete(row.id);
                          }}
                          disabled={isDeleting}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      <AdminTablePagination
        page={pagination.page}
        limit={pagination.limit}
        total={pagination.total || data.length}
        totalPages={pagination.totalPages || 1}
        shown={data.length}
        loading={loading}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
      />
    </div>
    </div>
  );
}
