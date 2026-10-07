'use client';

import AdminTable, { ColumnDef } from '@/components/features/admin/AdminTable';
import { Show } from '@/lib/types/shows';
import { deleteShow } from '@/lib/actions/shows';

const columns: ColumnDef<Show>[] = [
  {
    header: 'Title',
    accessorKey: 'title',
    sortable: true,
  },
  {
    header: 'Order',
    accessorKey: 'displayOrder',
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
    accessorKey: 'featured',
    sortable: true,
    cell: (row) => (row.featured ? 'Yes' : 'No'),
  },
];

export default function ShowsTable() {
  return (
    <AdminTable<Show>
      endpoint="/api/shows"
      listQuery="admin=true"
      columns={columns}
      resourceName="shows"
      onDelete={deleteShow}
    />
  );
}
