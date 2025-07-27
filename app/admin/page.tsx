import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-20">
      <h1 className="text-4xl font-bold text-center">Admin Dashboard</h1>
      <div className="mt-8 text-center">
        <Link href="/admin/shows" className="text-lg text-primary hover:underline">
          Manage Shows
        </Link>
      </div>
    </div>
  );
} 