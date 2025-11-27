'use client';

import AdminTable, { ColumnDef } from '@/components/features/admin/AdminTable';

interface Resource {
  id: number;
  title: string;
  slug: string;
  description?: string;
  fileUrl?: string;
  imageUrl?: string;
  isActive: boolean;
  requiresContactForm: boolean;
  downloadCount: number;
  createdAt: string;
}

const columns: ColumnDef<Resource>[] = [
  {
    header: 'Title',
    accessorKey: 'title',
  },
  {
    header: 'Slug',
    accessorKey: 'slug',
  },
  {
    header: 'Active',
    accessorKey: 'isActive',
    cell: (row) => (row.isActive ? 'Yes' : 'No'),
  },
  {
    header: 'Gated',
    accessorKey: 'requiresContactForm',
    cell: (row) => (row.requiresContactForm ? 'Yes' : 'No'),
  },
  {
    header: 'Downloads',
    accessorKey: 'downloadCount',
  },
];

export default function ResourcesTable() {
  return (
    <AdminTable<Resource>
      endpoint="/api/resources"
      columns={columns}
      resourceName="resources"
    />
  );
}

