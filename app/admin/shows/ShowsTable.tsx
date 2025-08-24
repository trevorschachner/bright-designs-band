'use client';

import AdminTable, { ColumnDef } from '@/components/features/admin/AdminTable';
import { Show } from '@/lib/types/shows';

const columns: ColumnDef<Show>[] = [
  {
    header: 'Title',
    accessorKey: 'title',
  },
  {
    header: 'Year',
    accessorKey: 'year',
  },
  {
    header: 'Difficulty',
    accessorKey: 'difficulty',
  },
];

export default function ShowsTable() {
  return (
    <AdminTable<Show>
      endpoint="/api/shows"
      columns={columns}
      resourceName="shows"
    />
  );
}
