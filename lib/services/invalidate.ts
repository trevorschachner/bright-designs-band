/**
 * Cache invalidation, one helper per entity, so a write route cannot forget a
 * tag or a page. Every write route calls exactly one of these after its write
 * succeeds (see the table in lib/services/README.md).
 *
 * Each helper expires the entity's own tags (the cached reads that join the
 * entity carry its tag too, see lib/cache-tags.ts) and the pages that render
 * it: the detail page(s), the home page, the list page and the sitemap.
 *
 * Tags are expired immediately (`{ expire: 0 }`) rather than with the `'max'`
 * stale-while-revalidate profile: the admin UI re-reads right after saving and
 * must see its own write, not the previous value served once more.
 */

import { revalidatePath, revalidateTag } from 'next/cache';
import { PATHS, TAGS } from '@/lib/cache-tags';

const EXPIRE_NOW = { expire: 0 };

/** Dynamic route patterns, for "every page of this route". */
const SHOW_PAGES = '/shows/[slug]';
const ARRANGEMENT_PAGES = '/arrangements/[id]';

function expireTags(...tags: string[]) {
  for (const tag of new Set(tags)) revalidateTag(tag, EXPIRE_NOW);
}

function expirePaths(...paths: (string | null | undefined)[]) {
  for (const path of new Set(paths.filter((p): p is string => Boolean(p)))) revalidatePath(path);
}

function expireAllPagesOf(...patterns: string[]) {
  for (const pattern of patterns) revalidatePath(pattern, 'page');
}

/**
 * A show was created, updated or deleted, or one of its files changed.
 * Pass `previousSlug` when the slug changed so the old URL is dropped too.
 */
export function invalidateShow(id: number, slug: string | null | undefined, previousSlug?: string | null) {
  expireTags(TAGS.show(id), TAGS.shows);
  expirePaths(
    slug ? PATHS.show(slug) : null,
    previousSlug && previousSlug !== slug ? PATHS.show(previousSlug) : null,
    PATHS.home,
    PATHS.shows,
    PATHS.sitemap
  );
}

/**
 * An arrangement (show part) was created, updated or deleted, its pieces were
 * relinked, or one of its files changed. Pass the parent show's slug so the
 * show page that lists it is refreshed too.
 */
export function invalidateArrangement(id: number, showSlug?: string | null) {
  expireTags(TAGS.arrangement(id), TAGS.arrangements);
  expirePaths(
    PATHS.arrangement(id),
    showSlug ? PATHS.show(showSlug) : null,
    PATHS.home,
    PATHS.arrangements,
    PATHS.sitemap
  );
}

/** A tag was created, renamed or deleted. Tags show on every show and part page. */
export function invalidateTags() {
  expireTags(TAGS.tags);
  expireAllPagesOf(SHOW_PAGES, ARRANGEMENT_PAGES);
  expirePaths(PATHS.home, PATHS.shows, PATHS.arrangements, PATHS.sitemap);
}

/** A source piece was created, edited or deleted. Credits show on every part. */
export function invalidatePieces() {
  expireTags(TAGS.pieces);
  expireAllPagesOf(SHOW_PAGES, ARRANGEMENT_PAGES);
  expirePaths(PATHS.home, PATHS.shows, PATHS.arrangements, PATHS.sitemap);
}

/** A resource (downloadable guide) was created, updated or deleted. */
export function invalidateResources() {
  expireTags(TAGS.resources);
  expirePaths('/resources', PATHS.home, PATHS.sitemap);
}

/** Everything public. For bulk changes that touch several entities at once. */
export function invalidateCatalog() {
  expireTags(TAGS.shows, TAGS.arrangements, TAGS.tags, TAGS.pieces, TAGS.resources);
  revalidatePath(PATHS.home, 'layout');
}
