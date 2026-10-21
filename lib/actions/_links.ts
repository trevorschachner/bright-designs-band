import { eq, inArray } from 'drizzle-orm'
import type { Tx } from '@/lib/database'
import { arrangementsToTags, pieces, showsToTags, tags } from '@/lib/database/schema'
import { InvalidError } from './_guarded'

/**
 * Join-table writes shared by the show and arrangement actions. Every id must
 * name an existing row: an unknown one is `invalid` (with the given path),
 * checked before anything is written, rather than a foreign-key failure
 * surfacing as `failed`.
 */

const REFERENCED = {
  tags: { table: tags, id: tags.id, noun: 'tag' },
  pieces: { table: pieces, id: pieces.id, noun: 'piece' },
} as const

/** Throws InvalidError (one issue per unknown id, at `path`) unless every id exists. */
export async function assertKnownIds(tx: Tx, kind: keyof typeof REFERENCED, ids: number[], path: string): Promise<void> {
  if (ids.length === 0) return
  const { table, id, noun } = REFERENCED[kind]
  const found = new Set((await tx.select({ id }).from(table).where(inArray(id, ids))).map((row) => row.id))
  const unknown = [...new Set(ids)].filter((each) => !found.has(each))
  if (unknown.length > 0) {
    throw new InvalidError(unknown.map((each) => ({ path, message: `Unknown ${noun} id ${each}` })))
  }
}

/** Replaces the tag links of a show or a part with `tagIds` (deduplicated). */
export async function replaceTagLinks(
  tx: Tx,
  owner: { showId: number } | { arrangementId: number },
  tagIds: number[]
): Promise<void> {
  const unique = [...new Set(tagIds)]
  await assertKnownIds(tx, 'tags', unique, 'tags')
  if ('showId' in owner) {
    await tx.delete(showsToTags).where(eq(showsToTags.showId, owner.showId))
    if (unique.length > 0) await tx.insert(showsToTags).values(unique.map((tagId) => ({ showId: owner.showId, tagId })))
  } else {
    await tx.delete(arrangementsToTags).where(eq(arrangementsToTags.arrangementId, owner.arrangementId))
    if (unique.length > 0) {
      await tx.insert(arrangementsToTags).values(unique.map((tagId) => ({ arrangementId: owner.arrangementId, tagId })))
    }
  }
}
