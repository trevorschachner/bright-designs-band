import { asc, count, eq, getTableColumns } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { guard } from '@/lib/auth/guard';
import { arrangementPieces, pieces } from '@/lib/database/schema';
import { pieceInputSchema } from '@/lib/validation/pieces';
import { BadRequestResponse, ErrorResponse, SuccessResponse } from '@/lib/utils/api-helpers';

export const dynamic = 'force-dynamic';

/**
 * Source pieces (#51). Admin-only, reads included: pieces carry copyright cost
 * and licensing status, which are internal. Responses are never edge-cached.
 */
export async function GET() {
  const gate = await guard('canEditArrangements');
  if (gate.denied) return gate.denied;

  try {
    const { db } = await import('@/lib/database');
    const rows = await db
      .select({ ...getTableColumns(pieces), usageCount: count(arrangementPieces.arrangementId) })
      .from(pieces)
      .leftJoin(arrangementPieces, eq(arrangementPieces.pieceId, pieces.id))
      .groupBy(pieces.id)
      .orderBy(asc(pieces.title), asc(pieces.id));
    return SuccessResponse(rows, 200, 0);
  } catch (error) {
    console.error('Error fetching pieces:', error);
    return ErrorResponse('Failed to fetch pieces');
  }
}

export async function POST(request: Request) {
  const gate = await guard('canEditArrangements');
  if (gate.denied) return gate.denied;

  const parsed = pieceInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return BadRequestResponse(parsed.error.flatten());

  try {
    const { db } = await import('@/lib/database');
    const [created] = await db.insert(pieces).values(parsed.data).returning();
    // @ts-expect-error - revalidateTag expects 1 arg but types mismatch
    revalidateTag('arrangements');
    return SuccessResponse(created, 201);
  } catch (error) {
    console.error('Error creating piece:', error);
    return ErrorResponse('Failed to create piece');
  }
}
