/** Sitemap reads: every public show slug and arrangement id. Throws on a database failure. */

import { db } from '@/lib/database';
import { arrangements, shows } from '@/lib/database/schema';
import { asc, desc } from 'drizzle-orm';
import { TAGS } from '@/lib/cache-tags';
import { cachedRead, toIso } from './cache';

export type SitemapEntries = {
  shows: { slug: string; updatedAt: string | null }[];
  arrangementIds: number[];
};

async function fetchSitemapEntries(): Promise<SitemapEntries> {
  const [showRows, arrangementRows] = await Promise.all([
    db.select({ slug: shows.slug, updatedAt: shows.updatedAt }).from(shows).orderBy(desc(shows.updatedAt)),
    db.select({ id: arrangements.id }).from(arrangements).orderBy(asc(arrangements.id)),
  ]);
  return {
    shows: showRows.filter((r) => r.slug).map((r) => ({ slug: r.slug, updatedAt: toIso(r.updatedAt) })),
    arrangementIds: arrangementRows.map((r) => r.id),
  };
}

/** Show slugs (newest edit first) and arrangement ids for /sitemap.xml. */
export const getSitemapEntries = cachedRead('sitemap-entries-v1', fetchSitemapEntries, {
  tags: () => [TAGS.shows, TAGS.arrangements],
  atBuildWithoutDb: { shows: [], arrangementIds: [] } as SitemapEntries,
});
