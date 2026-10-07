import { eq, inArray } from 'drizzle-orm';
import { guard } from '@/lib/auth/guard';
import { arrangementPieces, arrangements, pieces } from '@/lib/database/schema';
import { getArrangementPiecesForAdmin } from '@/lib/services/pieces';
import { getShowSlugForArrangement } from '@/lib/services/arrangements';
import { invalidateArrangement } from '@/lib/services/invalidate';
import { arrangementPiecesInputSchema } from '@/lib/validation/pieces';
import {
  BadRequestResponse,
  ErrorResponse,
  NotFoundResponse,
  SuccessResponse,
} from '@/lib/utils/api-helpers';

/**
 * The ordered source pieces of one arrangement (show part). See #51.
 *
 * PUT replaces the whole list in one transaction, so add, remove and reorder
 * are the same call and the order can never be left half-written.
 */

type Context = { params: Promise<{ id: string }> };

export const dynamic = 'force-dynamic';

const parseId = (raw: string) => {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export async function GET(_request: Request, { params }: Context) {
  const gate = await guard('canEditArrangements');
  if (gate.denied) return gate.denied;

  const arrangementId = parseId((await params).id);
  if (arrangementId === null) return BadRequestResponse('Invalid arrangement id');

  try {
    return SuccessResponse(await getArrangementPiecesForAdmin(arrangementId), 200, 0);
  } catch (error) {
    console.error('Error fetching arrangement pieces:', error);
    return ErrorResponse('Failed to fetch arrangement pieces');
  }
}

export async function PUT(request: Request, { params }: Context) {
  const gate = await guard('canEditArrangements');
  if (gate.denied) return gate.denied;

  const arrangementId = parseId((await params).id);
  if (arrangementId === null) return BadRequestResponse('Invalid arrangement id');

  const parsed = arrangementPiecesInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return BadRequestResponse(parsed.error.flatten());
  const { pieceIds } = parsed.data;

  try {
    const { db } = await import('@/lib/database');

    const arrangement = await db.query.arrangements.findFirst({
      where: eq(arrangements.id, arrangementId),
      columns: { id: true },
    });
    if (!arrangement) return NotFoundResponse('Arrangement');

    if (pieceIds.length > 0) {
      const found = await db
        .select({ id: pieces.id })
        .from(pieces)
        .where(inArray(pieces.id, pieceIds));
      const known = new Set(found.map(p => p.id));
      const missing = pieceIds.filter(id => !known.has(id));
      if (missing.length > 0) return BadRequestResponse({ missingPieceIds: missing });
    }

    await db.transaction(async tx => {
      await tx.delete(arrangementPieces).where(eq(arrangementPieces.arrangementId, arrangementId));
      if (pieceIds.length > 0) {
        await tx.insert(arrangementPieces).values(
          pieceIds.map((pieceId, i) => ({ arrangementId, pieceId, orderIndex: i + 1 }))
        );
      }
    });

    // The credit list is part of the arrangement, so this is an arrangement
    // change, not a pieces change.
    invalidateArrangement(arrangementId, await getShowSlugForArrangement(arrangementId));
    return SuccessResponse(await getArrangementPiecesForAdmin(arrangementId), 200, 0);
  } catch (error) {
    console.error('Error updating arrangement pieces:', error);
    return ErrorResponse('Failed to update arrangement pieces');
  }
}
