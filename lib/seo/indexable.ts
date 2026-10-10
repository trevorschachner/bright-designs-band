/**
 * An arrangement page is worth indexing only once it says something: a
 * template line ("Custom arrangement of X by Y") is a thin duplicate of the
 * show page. Under the threshold the page renders, is linked, and is
 * noindex,follow; it is also left out of the sitemap.
 */
export const MIN_ARRANGEMENT_WORDS = 120
export function isIndexableArrangement(description: string | null | undefined): boolean {
  return (description ?? '').trim().split(/\s+/).filter(Boolean).length >= MIN_ARRANGEMENT_WORDS
}
