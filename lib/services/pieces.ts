/**
 * Source-piece reads (#51). The public read returns only title and composer;
 * copyright cost and licensing status are internal and appear only in the
 * uncached admin reads. Every function throws on a database failure.
 */

import { db } from '@/lib/database';
import { arrangementPieces, pieces } from '@/lib/database/schema';
import { asc, count, eq, inArray } from 'drizzle-orm';
import type { PublicPiece } from '@/lib/pieces/credits';
import { TAGS } from '@/lib/cache-tags';
import { cachedRead } from './cache';

/** Arrangement id to its ordered pieces. A plain object: it survives the cache's JSON. */
export type PiecesByArrangement = Record<number, PublicPiece[]>;

async function fetchPublicPiecesByArrangementIds(arrangementIds: number[]): Promise<PiecesByArrangement> {
  const byArrangement: PiecesByArrangement = {};
  if (arrangementIds.length === 0) return byArrangement;

  const rows = await db
    .select({
      arrangementId: arrangementPieces.arrangementId,
      title: pieces.title,
      composer: pieces.composer,
    })
    .from(arrangementPieces)
    .innerJoin(pieces, eq(arrangementPieces.pieceId, pieces.id))
    .where(inArray(arrangementPieces.arrangementId, arrangementIds))
    .orderBy(arrangementPieces.arrangementId, arrangementPieces.orderIndex);

  for (const { arrangementId, title, composer } of rows) {
    (byArrangement[arrangementId] ??= []).push({ title, composer });
  }
  return byArrangement;
}

/** Ordered public credits for each part, keyed by arrangement id. */
export const getPublicPiecesByArrangementIds = cachedRead(
  'public-pieces-v2',
  fetchPublicPiecesByArrangementIds,
  {
    tags: () => [TAGS.pieces, TAGS.arrangements],
    atBuildWithoutDb: {} as PiecesByArrangement,
  }
);

/** Every piece with how many parts use it. Admin only, uncached. */
export async function getPiecesForAdmin() {
  return db
    .select({
      id: pieces.id,
      title: pieces.title,
      composer: pieces.composer,
      copyrightAmountUsd: pieces.copyrightAmountUsd,
      licensingStatus: pieces.licensingStatus,
      createdAt: pieces.createdAt,
      updatedAt: pieces.updatedAt,
      usageCount: count(arrangementPieces.arrangementId),
    })
    .from(pieces)
    .leftJoin(arrangementPieces, eq(arrangementPieces.pieceId, pieces.id))
    .groupBy(pieces.id)
    .orderBy(asc(pieces.title), asc(pieces.id));
}

/** One part's ordered pieces with licensing detail. Admin only, uncached. */
export async function getArrangementPiecesForAdmin(arrangementId: number) {
  return db
    .select({
      id: pieces.id,
      title: pieces.title,
      composer: pieces.composer,
      copyrightAmountUsd: pieces.copyrightAmountUsd,
      licensingStatus: pieces.licensingStatus,
      orderIndex: arrangementPieces.orderIndex,
    })
    .from(arrangementPieces)
    .innerJoin(pieces, eq(pieces.id, arrangementPieces.pieceId))
    .where(eq(arrangementPieces.arrangementId, arrangementId))
    .orderBy(asc(arrangementPieces.orderIndex));
}
