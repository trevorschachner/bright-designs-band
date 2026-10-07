/** Tag reads. Throws on a database failure. */

import { db } from '@/lib/database';
import { tags } from '@/lib/database/schema';
import { asc, eq } from 'drizzle-orm';
import { TAGS } from '@/lib/cache-tags';
import { cachedRead, toIso } from './cache';

export type TagRow = { id: number; name: string };

async function fetchAllTags(): Promise<TagRow[]> {
  return db.select({ id: tags.id, name: tags.name }).from(tags).orderBy(asc(tags.name));
}

/** Every tag, by name. */
export const getAllTags = cachedRead('all-tags-v2', fetchAllTags, {
  tags: () => [TAGS.tags],
  atBuildWithoutDb: [] as TagRow[],
});

/** A tag as the admin sees it: `updatedAt` is sent back on rename (lib/actions/tags.ts). */
export type AdminTagRow = TagRow & { updatedAt: string | null };

/** Every tag, uncached, for the admin tags page (it re-reads after each write). */
export async function getTagsForAdmin(): Promise<AdminTagRow[]> {
  const rows = await db
    .select({ id: tags.id, name: tags.name, updatedAt: tags.updatedAt })
    .from(tags)
    .orderBy(asc(tags.name));
  return rows.map((row) => ({ ...row, updatedAt: toIso(row.updatedAt) }));
}

async function fetchTag(id: number): Promise<TagRow | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  const [row] = await db.select({ id: tags.id, name: tags.name }).from(tags).where(eq(tags.id, id)).limit(1);
  return row ?? null;
}

/** One tag by id, or null. */
export const getTag = cachedRead('tag-v1', fetchTag, {
  tags: () => [TAGS.tags],
  atBuildWithoutDb: null as TagRow | null,
});
