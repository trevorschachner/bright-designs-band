'use client';

import AdminTable, { ColumnDef } from '@/components/features/admin/AdminTable';
import { Show } from '@/lib/types/shows';

const columns: ColumnDef<Show>[] = [
  {
    header: 'Title',
    accessorKey: 'title',
    sortable: true,
  },
  {
    header: 'Order',
    accessorKey: 'displayOrder' as any,
    sortable: true,
  },
  {
    header: 'Year',
    accessorKey: 'year',
    sortable: true,
  },
  {
    header: 'Difficulty',
    accessorKey: 'difficulty',
    sortable: true,
  },
  {
    header: 'Featured',
    accessorKey: 'featured' as any,
    sortable: true,
    cell: (row) => (row as any).featured ? 'Yes' : 'No',
  },
];

export default function ShowsTable() {
  return (
    <AdminTable<Show>
      endpoint="/api/shows"
      listQuery="admin=true"
      columns={columns}
      resourceName="shows"
    />
  );
}
