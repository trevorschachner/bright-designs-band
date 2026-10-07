import { tags } from '@/lib/database/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { guard } from '@/lib/auth/guard';
import { tagInputSchema } from '@/lib/validation/tags';
import { invalidateTags } from '@/lib/services/invalidate';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let db: any;
  try {
    ({ db } = await import('@/lib/database'));
  } catch (e) {
    console.error('Database import failed (likely no DATABASE_URL).', e);
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }
  const tag = await db.query.tags.findFirst({
    where: eq(tags.id, parseInt(id, 10)),
  });
  return NextResponse.json(tag);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gate = await guard('canManageTags');
  if (gate.denied) return gate.denied;

  let db: any;
  try {
    ({ db } = await import('@/lib/database'));
  } catch (e) {
    console.error('Database import failed (likely no DATABASE_URL).', e);
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const parsed = tagInputSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Bad request', details: parsed.error.flatten() }, { status: 400 });
  }

  const updatedTag = await db.update(tags).set(parsed.data).where(eq(tags.id, parseInt(id, 10))).returning();
  invalidateTags();
  return NextResponse.json(updatedTag);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gate = await guard('canManageTags');
  if (gate.denied) return gate.denied;

  let db: any;
  try {
    ({ db } = await import('@/lib/database'));
  } catch (e) {
    console.error('Database import failed (likely no DATABASE_URL).', e);
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }
  const deletedTag = await db.delete(tags).where(eq(tags.id, parseInt(id, 10))).returning();
  invalidateTags();
  return NextResponse.json(deletedTag);
} 