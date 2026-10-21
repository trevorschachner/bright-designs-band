/**
 * Resource (downloadable guide) reads. Inactive resources are drafts: only the
 * uncached admin read returns them. Every function throws on a database failure.
 */

import { db } from '@/lib/database';
import { resources } from '@/lib/database/schema';
import { count, desc, eq, ilike, type SQL } from 'drizzle-orm';
import { likePattern } from '@/lib/filters/admin-search';
import { totalPagesFor } from '@/lib/filters/catalog-params';
import { TAGS } from '@/lib/cache-tags';
import { cachedRead, toIso } from './cache';
import type { CatalogPage } from './catalog';

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

/**
 * One page of every resource including drafts, newest first, optionally
 * filtered by title (`q`). Admin only, uncached. A page past the end (a stale
 * page after deletes) serves the last page; `page` in the result is the one
 * served, as in the catalog's pages.
 */
export async function getResourcesPageForAdmin({
  q,
  page,
  limit,
}: {
  q?: string;
  page: number;
  limit: number;
}): Promise<CatalogPage<ResourceRow>> {
  const where = q ? ilike(resources.title, likePattern(q)) : undefined;
  const countQuery = db.select({ count: count() }).from(resources);
  const [row] = await (where ? countQuery.where(where) : countQuery);
  const total = Number(row?.count ?? 0);
  const totalPages = totalPagesFor(total, limit);
  const served = Math.max(1, Math.min(page, totalPages));
  const base = db.select(RESOURCE_COLUMNS).from(resources);
  // `id` breaks createdAt ties so no row repeats or vanishes between pages.
  const rows = await (where ? base.where(where) : base)
    .orderBy(desc(resources.createdAt), desc(resources.id))
    .limit(limit)
    .offset((served - 1) * limit);
  return { rows: serialise(rows), total, page: served, pageSize: limit, totalPages };
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
