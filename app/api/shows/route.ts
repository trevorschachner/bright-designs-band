import { db } from '@/lib/db';
import { shows } from '@/lib/db/schema';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const allShows = await db.query.shows.findMany();
  return NextResponse.json(allShows);
}

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const newShow = await db.insert(shows).values(body).returning();
  return NextResponse.json(newShow);
} 