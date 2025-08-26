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

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${resourceName}`);
        }
        const result = await response.json();
        setData(result.data.shows || result.data); // Adjust based on your API response structure
      } catch (e) {
        setError(e instanceof Error ? e.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [endpoint, resourceName]);

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
                <Link href={`/admin/${resourceName.toLowerCase()}/${row.id}`}>
                  <Button variant="outline" size="sm">Edit</Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
