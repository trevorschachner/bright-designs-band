/**
 * Cache invalidation, one helper per entity, so a write route cannot forget a
 * tag or a page. Every write route calls exactly one of these after its write
 * succeeds (see the table in lib/services/README.md).
 *
 * Each helper expires the entity's own tags (the cached reads that join the
 * entity carry its tag too, see lib/cache-tags.ts) and the pages that render
 * it: the detail page(s), the home page, the list page and the sitemap (and,
 * for shows, /llms.txt and /llms-full.txt).
 *
 * Tags are expired immediately (`{ expire: 0 }`) rather than with the `'max'`
 * stale-while-revalidate profile: the admin UI re-reads right after saving and
 * must see its own write, not the previous value served once more.
 */

import { revalidatePath, revalidateTag } from 'next/cache';
import { PATHS, TAGS } from '@/lib/cache-tags';
import { collections } from '@/lib/collections';

const EXPIRE_NOW = { expire: 0 };

/** Dynamic route patterns, for "every page of this route". */
const SHOW_PAGES = '/shows/[slug]';
const ARRANGEMENT_PAGES = '/arrangements/[slug]';

function expireTags(...tags: string[]) {
  for (const tag of new Set(tags)) revalidateTag(tag, EXPIRE_NOW);
}

function expirePaths(...paths: (string | null | undefined)[]) {
  for (const path of new Set(paths.filter((p): p is string => Boolean(p)))) revalidatePath(path);
}

/**
 * Every /collections/<slug> page. They list shows (by difficulty or tag) and
 * are prerendered; one built without a database holds no tagged read, so tag
 * expiry alone would never refresh it. Name the paths.
 */
const collectionPaths = () => collections.map((c) => PATHS.collection(c.slug));

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
    PATHS.sitemap,
    PATHS.llms,
    PATHS.llmsFull,
    ...collectionPaths()
  );
}

/**
 * An arrangement (show part) was created, updated or deleted, its pieces were
 * relinked, or one of its files changed. Pass the parent show's slug so the
 * show page that lists it is refreshed too, and `previousSlug` when the
 * arrangement's own slug changed so the old URL is dropped.
 */
export function invalidateArrangement(
  id: number,
  slug: string | null | undefined,
  showSlug?: string | null,
  previousSlug?: string | null
) {
  expireTags(TAGS.arrangement(id), TAGS.arrangements);
  expirePaths(
    slug ? PATHS.arrangement(slug) : null,
    previousSlug && previousSlug !== slug ? PATHS.arrangement(previousSlug) : null,
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
  // A tag collection (e.g. "Small Band") filters on the tag's name.
  expirePaths(PATHS.home, PATHS.shows, PATHS.arrangements, PATHS.sitemap, ...collectionPaths());
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
  expirePaths(PATHS.resources, PATHS.home, PATHS.sitemap);
}
