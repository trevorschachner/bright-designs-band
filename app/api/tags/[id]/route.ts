import { tags } from '@/lib/database/schema';
import { db } from '@/lib/database';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { guard } from '@/lib/auth/guard';
import { tagInputSchema } from '@/lib/validation/tags';
import { invalidateTags } from '@/lib/services/invalidate';
import { reportError } from '@/lib/observability/report-error';

/** Generic body only: the underlying message never reaches the client. */
async function failed(error: unknown, operation: string) {
  await reportError(error, { operation });
  return NextResponse.json({ error: 'Failed to save tag' }, { status: 500 });
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const tag = await db.query.tags.findFirst({
      where: eq(tags.id, parseInt(id, 10)),
    });
    return NextResponse.json(tag);
  } catch (error) {
    await reportError(error, { operation: 'GET /api/tags/[id]' });
    return NextResponse.json({ error: 'Failed to fetch tag' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gate = await guard('canManageTags');
  if (gate.denied) return gate.denied;

  try {
    const parsed = tagInputSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Bad request', details: parsed.error.flatten() }, { status: 400 });
    }

    const updatedTag = await db.update(tags).set(parsed.data).where(eq(tags.id, parseInt(id, 10))).returning();
    invalidateTags();
    return NextResponse.json(updatedTag);
  } catch (error) {
    return failed(error, 'PUT /api/tags/[id]');
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gate = await guard('canManageTags');
  if (gate.denied) return gate.denied;

  try {
    const deletedTag = await db.delete(tags).where(eq(tags.id, parseInt(id, 10))).returning();
    invalidateTags();
    return NextResponse.json(deletedTag);
  } catch (error) {
    return failed(error, 'DELETE /api/tags/[id]');
  }
}
