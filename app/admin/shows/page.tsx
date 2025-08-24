import { createClient } from '@/lib/utils/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requirePermission } from '@/lib/auth/roles';
import { Suspense } from 'react';
import ShowsTable from './ShowsTable';

export default async function ManageShowsPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  if (!requirePermission(session.user.email, 'canManageShows')) {
    redirect('/'); // Or redirect to an unauthorized page
  }

  return (
    <div className="container mx-auto py-20">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Manage Shows</h1>
        <Link href="/admin/shows/new" className="bg-primary text-primary-foreground px-4 py-2 rounded">
          Add New Show
        </Link>
      </div>
      <Suspense fallback={<p>Loading shows...</p>}>
        <ShowsTable />
      </Suspense>
    </div>
  );
} 