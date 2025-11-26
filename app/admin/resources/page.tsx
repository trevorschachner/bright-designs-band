import { createClient } from '@/lib/utils/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requirePermission } from '@/lib/auth/roles';
import { Suspense } from 'react';
import ResourcesTable from './ResourcesTable';
import { 
  Breadcrumb, 
  BreadcrumbList, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbSeparator, 
  BreadcrumbPage 
} from '@/components/ui/breadcrumb';

export default async function ManageResourcesPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // Assuming if they can manage shows they can manage resources, or we need a new permission. 
  // Reusing 'canManageShows' for simplicity for now as 'admin' check.
  if (!requirePermission(session.user.email, 'canManageShows')) {
    redirect('/');
  }

  return (
    <div className="container mx-auto py-20">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Resources</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Manage Resources</h1>
        <Link href="/admin/resources/new" className="bg-primary text-primary-foreground px-4 py-2 rounded">
          Add New Resource
        </Link>
      </div>
      <Suspense fallback={<p>Loading resources...</p>}>
        <ResourcesTable />
      </Suspense>
    </div>
  );
}

