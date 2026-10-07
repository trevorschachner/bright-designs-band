import { eq } from 'drizzle-orm';
import { guard } from '@/lib/auth/guard';
import { pieces } from '@/lib/database/schema';
import { pieceInputSchema } from '@/lib/validation/pieces';
import { invalidatePieces } from '@/lib/services/invalidate';
import {
  BadRequestResponse,
  ErrorResponse,
  NotFoundResponse,
  SuccessResponse,
} from '@/lib/utils/api-helpers';

type Context = { params: Promise<{ id: string }> };

const parseId = (raw: string) => {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export async function PUT(request: Request, { params }: Context) {
  const gate = await guard('canEditArrangements');
  if (gate.denied) return gate.denied;

  const id = parseId((await params).id);
  if (id === null) return BadRequestResponse('Invalid piece id');

  const parsed = pieceInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return BadRequestResponse(parsed.error.flatten());

  try {
    const { db } = await import('@/lib/database');
    const [updated] = await db
      .update(pieces)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(pieces.id, id))
      .returning();
    if (!updated) return NotFoundResponse('Piece');
    invalidatePieces();
    return SuccessResponse(updated, 200, 0);
  } catch (error) {
    console.error('Error updating piece:', error);
    return ErrorResponse('Failed to update piece');
  }
}

/** Deleting a piece also unlinks it from every part (FK cascade). */
export async function DELETE(_request: Request, { params }: Context) {
  const gate = await guard('canEditArrangements');
  if (gate.denied) return gate.denied;

  const id = parseId((await params).id);
  if (id === null) return BadRequestResponse('Invalid piece id');

  try {
    const { db } = await import('@/lib/database');
    const [deleted] = await db.delete(pieces).where(eq(pieces.id, id)).returning();
    if (!deleted) return NotFoundResponse('Piece');
    invalidatePieces();
    return SuccessResponse(deleted, 200, 0);
  } catch (error) {
    console.error('Error deleting piece:', error);
    return ErrorResponse('Failed to delete piece');
  }
}
