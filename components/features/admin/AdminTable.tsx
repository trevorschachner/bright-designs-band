'use client';

import { useEffect, useState } from 'react';
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
import { Trash2 } from 'lucide-react';

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

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${resourceName}`);
      }
      const result = await response.json();
      const payload = result?.data;
      const rows =
        Array.isArray(payload?.shows) ? payload.shows :
        Array.isArray(payload?.data) ? payload.data :
        Array.isArray(payload) ? payload : [];
      setData(rows as T[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [endpoint, resourceName]);

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
    </div>
  );
}
