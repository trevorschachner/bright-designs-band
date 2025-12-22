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
  ChevronLeft,
  ChevronRight,
  Trash2,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface ColumnDef<T> {
  header: string;
  accessorKey: keyof T;
  cell?: (row: T) => React.ReactNode;
}

interface AdminTableProps<T> {
  endpoint: string;
  columns: ColumnDef<T>[];
  resourceName: string;
}

export default function AdminTable<T extends { id: number }>({
  endpoint,
  columns,
  resourceName,
}: AdminTableProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Determine separator for query params
      const separator = endpoint.includes('?') ? '&' : '?';
      const url = `${endpoint}${separator}page=${pagination.page}&limit=${pagination.limit}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${resourceName}`);
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
          total: responseData.pagination.total || 0,
          totalPages: responseData.pagination.totalPages || 1,
        }));
      } else {
        // Fallback for older/simpler endpoints
        const payload = responseData;
        const rows =
          Array.isArray(payload?.shows) ? payload.shows :
          Array.isArray(payload?.data) ? payload.data :
          Array.isArray(payload) ? payload : [];
        setData(rows as T[]);
        
        // Calculate total and totalPages based on rows returned
        // If we received fewer items than limit, this is the last page
        if (rows.length < pagination.limit) {
          // Last page: total = items on previous pages + items on this page
          const calculatedTotal = (pagination.page - 1) * pagination.limit + rows.length;
          setPagination(prev => ({
            ...prev,
            total: calculatedTotal,
            totalPages: pagination.page,
          }));
        } else {
          // Not the last page: we know there are at least (page * limit) items
          // Set total to a minimum estimate, but we don't know the exact total
          const minTotal = pagination.page * pagination.limit;
          setPagination(prev => ({
            ...prev,
            total: Math.max(prev.total, minTotal), // Keep existing total if higher, otherwise use minimum
            totalPages: Math.max(prev.totalPages, pagination.page + 1), // At least one more page exists
          }));
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [endpoint, resourceName, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleLimitChange = (newLimit: number) => {
    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 1 && value <= pagination.totalPages) {
      handlePageChange(value);
    }
  };

  const handleDelete = async (id: number | string) => {

    try {
      setIsDeleting(true);
      // Determine the delete endpoint URL
      // If endpoint is /api/shows, we want /api/shows/[id]
      const deleteUrl = `${endpoint}/${id}`;
      
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete ${resourceName}`);
      }

      // Refresh data
      await fetchData();
      setDeletingId(null);
    } catch (e) {
      console.error('Delete error:', e);
      alert(e instanceof Error ? e.message : 'Failed to delete item');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={String(column.accessorKey)}>{column.header}</TableHead>
              ))}
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
    );
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (data.length === 0) {
    return <p>No {resourceName} found.</p>;
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={String(column.accessorKey)}>{column.header}</TableHead>
            ))}
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              {columns.map((column) => (
                <TableCell key={String(column.accessorKey)}>
                  {column.cell ? column.cell(row) : (row[column.accessorKey] as any)}
                </TableCell>
              ))}
              <TableCell>
                <div className="flex items-center gap-2">
                  <Link href={`/admin/${resourceName.toLowerCase()}/${(row as any).slug ?? row.id}`}>
                    <Button variant="outline" size="sm">Edit</Button>
                  </Link>
                  
                  <AlertDialog open={deletingId === row.id} onOpenChange={(open) => setDeletingId(open ? row.id : null)}>
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
      
      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 border-t">
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Showing {data.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} to {Math.min(pagination.page * pagination.limit, pagination.total || data.length)} of {pagination.total || data.length} entries
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show:</span>
            <Select
              value={pagination.limit.toString()}
              onValueChange={(value) => handleLimitChange(parseInt(value, 10))}
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
            onClick={() => handlePageChange(1)}
            disabled={pagination.page <= 1 || loading}
            title="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
            <span className="sr-only">First</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1 || loading}
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
              max={pagination.totalPages || 1}
              value={pagination.page}
              onChange={handlePageInputChange}
              onBlur={(e) => {
                const value = parseInt(e.target.value, 10);
                if (isNaN(value) || value < 1) {
                  e.target.value = '1';
                  handlePageChange(1);
                } else if (value > pagination.totalPages) {
                  e.target.value = pagination.totalPages.toString();
                  handlePageChange(pagination.totalPages);
                }
              }}
              className="w-16 h-8 text-center"
            />
            <span className="text-sm text-muted-foreground">of {pagination.totalPages || 1}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages || loading}
            title="Next page"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.totalPages || 1)}
            disabled={pagination.page >= pagination.totalPages || loading}
            title="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
            <span className="sr-only">Last</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
