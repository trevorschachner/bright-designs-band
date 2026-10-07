/** Tag reads. Throws on a database failure. */

import { db } from '@/lib/database';
import { tags } from '@/lib/database/schema';
import { asc } from 'drizzle-orm';
import { TAGS } from '@/lib/cache-tags';
import { cachedRead } from './cache';

export type TagRow = { id: number; name: string };

async function fetchAllTags(): Promise<TagRow[]> {
  return db.select({ id: tags.id, name: tags.name }).from(tags).orderBy(asc(tags.name));
}

/** Every tag, by name. */
export const getAllTags = cachedRead('all-tags-v2', fetchAllTags, {
  tags: () => [TAGS.tags],
  atBuildWithoutDb: [] as TagRow[],
});

/** Every tag, uncached, for the admin tags page (it re-reads after each write). */
export function getTagsForAdmin(): Promise<TagRow[]> {
  return fetchAllTags();
}
