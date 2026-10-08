/**
 * Resource (downloadable guide) reads. Inactive resources are drafts: only the
 * uncached admin read returns them. Every function throws on a database failure.
 */

import { db } from '@/lib/database';
import { resources } from '@/lib/database/schema';
import { desc, eq, ilike, type SQL } from 'drizzle-orm';
import { likePattern } from '@/lib/filters/admin-search';
import { TAGS } from '@/lib/cache-tags';
import { cachedRead, toIso } from './cache';

export type ResourceRow = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  fileUrl: string | null;
  imageUrl: string | null;
  isActive: boolean;
  requiresContactForm: boolean;
  downloadCount: number;
  createdAt: string | null;
  updatedAt: string | null;
};

const RESOURCE_COLUMNS = {
  id: resources.id,
  title: resources.title,
  slug: resources.slug,
  description: resources.description,
  fileUrl: resources.fileUrl,
  imageUrl: resources.imageUrl,
  isActive: resources.isActive,
  requiresContactForm: resources.requiresContactForm,
  downloadCount: resources.downloadCount,
  createdAt: resources.createdAt,
  updatedAt: resources.updatedAt,
};

type RawResource = Omit<ResourceRow, 'createdAt' | 'updatedAt'> & {
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
};

const serialise = (rows: RawResource[]): ResourceRow[] =>
  rows.map((r) => ({ ...r, createdAt: toIso(r.createdAt), updatedAt: toIso(r.updatedAt) }));

async function fetchActiveResources(): Promise<ResourceRow[]> {
  const rows = await db
    .select(RESOURCE_COLUMNS)
    .from(resources)
    .where(eq(resources.isActive, true))
    .orderBy(desc(resources.createdAt));
  return serialise(rows);
}

/** Active resources, newest first. */
export const getActiveResources = cachedRead('active-resources-v2', fetchActiveResources, {
  tags: () => [TAGS.resources],
  atBuildWithoutDb: [] as ResourceRow[],
});

/** Every resource including drafts, newest first, optionally filtered by title (`q`). Admin only, uncached. */
export async function getResourcesForAdmin(q?: string): Promise<ResourceRow[]> {
  const base = db.select(RESOURCE_COLUMNS).from(resources);
  const rows = await (q ? base.where(ilike(resources.title, likePattern(q))) : base).orderBy(desc(resources.createdAt));
  return serialise(rows);
}

/** A route id is a numeric primary key or a slug. */
function resourceWhere(idOrSlug: string): SQL {
  return /^\d+$/.test(idOrSlug) ? eq(resources.id, Number(idOrSlug)) : eq(resources.slug, idOrSlug);
}

async function fetchResource(idOrSlug: string): Promise<ResourceRow | null> {
  const [row] = await db.select(RESOURCE_COLUMNS).from(resources).where(resourceWhere(idOrSlug)).limit(1);
  return row ? serialise([row])[0] : null;
}

/**
 * One resource by id or slug, active or not, or null. Cached: the route
 * decides who may see an inactive one (staff only, never publicly cached).
 * Every resource write calls invalidateResources(), which expires this.
 */
export const getResource = cachedRead('resource-v1', fetchResource, {
  tags: () => [TAGS.resources],
  atBuildWithoutDb: null as ResourceRow | null,
});


/** One resource by id or slug, drafts included, uncached. For the admin editor (it saves with `updatedAt`). */
export function getResourceForAdmin(idOrSlug: string): Promise<ResourceRow | null> {
  return fetchResource(idOrSlug);
}
