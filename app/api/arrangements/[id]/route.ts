import { db } from '@/lib/db';
import { arrangements } from '@/lib/db/schema';
import { createClient } from '@/utils/supabase/server';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const arrangement = await db.query.arrangements.findFirst({
    where: eq(arrangements.id, parseInt(params.id, 10)),
  });
  return NextResponse.json(arrangement);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const updatedArrangement = await db.update(arrangements).set(body).where(eq(arrangements.id, parseInt(params.id, 10))).returning();
  return NextResponse.json(updatedArrangement);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const deletedArrangement = await db.delete(arrangements).where(eq(arrangements.id, parseInt(params.id, 10))).returning();
  return NextResponse.json(deletedArrangement);
} 