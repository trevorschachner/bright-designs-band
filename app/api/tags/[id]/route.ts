import { db } from '@/lib/db';
import { tags } from '@/lib/db/schema';
import { createClient } from '@/utils/supabase/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tag = await db.query.tags.findFirst({
    where: eq(tags.id, parseInt(id, 10)),
  });
  return NextResponse.json(tag);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const updatedTag = await db.update(tags).set(body).where(eq(tags.id, parseInt(id, 10))).returning();
  return NextResponse.json(updatedTag);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const deletedTag = await db.delete(tags).where(eq(tags.id, parseInt(id, 10))).returning();
  return NextResponse.json(deletedTag);
} 