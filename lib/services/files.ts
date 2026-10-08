/**
 * Files belong to a show, an arrangement, or both. A file write (upload,
 * YouTube link, delete, which can also clear a show's art) is a change to its
 * owner, so it invalidates through the owner's helper.
 */

import { getShowSlugById } from './shows';
import { getShowSlugForArrangement } from './arrangements';
import { invalidateArrangement, invalidateShow } from './invalidate';

/** Looks up the slug for the page path; a failed lookup still expires the tags. */
export async function slugOrNull(lookup: () => Promise<string | null>): Promise<string | null> {
  try {
    return await lookup();
  } catch (error) {
    console.error('Slug lookup for cache invalidation failed:', error);
    return null;
  }
}

export async function invalidateFileOwner(owner: {
  showId?: number | null;
  arrangementId?: number | null;
}): Promise<void> {
  const { showId, arrangementId } = owner;
  if (arrangementId) {
    invalidateArrangement(arrangementId, await slugOrNull(() => getShowSlugForArrangement(arrangementId)));
  }
  if (showId) {
    invalidateShow(showId, await slugOrNull(() => getShowSlugById(showId)));
  }
}
