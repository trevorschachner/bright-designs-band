import { db } from '@/lib/db';
import { shows } from '@/lib/db/schema';
import { createClient } from '@/utils/supabase/server';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const show = await db.query.shows.findFirst({
    where: eq(shows.id, parseInt(params.id, 10)),
  });
  return NextResponse.json(show);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const updatedShow = await db.update(shows).set(body).where(eq(shows.id, parseInt(params.id, 10))).returning();
  return NextResponse.json(updatedShow);
}

export async function DELETE(request: Request, { params }: { params: { id:string } }) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const deletedShow = await db.delete(shows).where(eq(shows.id, parseInt(params.id, 10))).returning();
  return NextResponse.json(deletedShow);
} 