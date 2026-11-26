/**
 * Perusal scores (#99): each part's private full score, set in the show
 * editor's Perusal score slot (setPerusalScore in lib/actions/files.ts).
 * Server-only and uncached: the path names a private object, and callers
 * (the watermarking route) read the object right after.
 */

import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/database';
import { arrangements, files } from '@/lib/database/schema';
import { isDownloadRoute, withRootPrefix } from '@/lib/storage';

/**
 * The object key (root prefix included) of the part's perusal score in the
 * private bucket (`privateStorageBucket()` in lib/storage.ts), or null when the
 * part has none. A slot file that is not a private-bucket row also gives null,
 * so a caller never serves a public object as a perusal score.
 */
export async function getPerusalScore(arrangementId: number): Promise<string | null> {
  const [row] = await db
    .select({ storagePath: files.storagePath, url: files.url })
    .from(arrangements)
    .innerJoin(files, eq(files.id, arrangements.perusalScoreFileId))
    .where(and(eq(arrangements.id, arrangementId), eq(files.isPublic, false)))
    .limit(1);
  if (!row || !isDownloadRoute(row.url)) return null;
  return withRootPrefix(row.storagePath);
}
