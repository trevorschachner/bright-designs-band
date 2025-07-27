import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';

async function getShows() {
  const response = await fetch('http://localhost:3000/api/shows');
  if (!response.ok) {
    throw new Error('Failed to fetch shows');
  }
  return response.json();
}

export default async function ManageShowsPage() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const shows = await getShows();

  return (
    <div className="container mx-auto py-20">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Manage Shows</h1>
        <Link href="/admin/shows/new" className="bg-primary text-primary-foreground px-4 py-2 rounded">
          Add New Show
        </Link>
      </div>
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left">Title</th>
            <th className="text-left">Year</th>
            <th className="text-left">Difficulty</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {shows.map((show: any) => (
            <tr key={show.id}>
              <td>{show.title}</td>
              <td>{show.year}</td>
              <td>{show.difficulty}</td>
              <td>
                <Link href={`/admin/shows/${show.id}`} className="text-primary hover:underline">
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 