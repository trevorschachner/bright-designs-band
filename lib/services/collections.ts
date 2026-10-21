import { collections, collectionsForShow, getCollectionBySlug, MIN_COLLECTION_SHOWS, type CollectionConfig, type ShowFacts } from '@/lib/collections'
import { getCollectionCounts } from './shows'

/**
 * Which collection pages exist. `lib/collections.ts` is the config and the
 * membership rule (pure); this module applies the one publish rule (at least
 * MIN_COLLECTION_SHOWS matching shows) on top of the cached counts. Every
 * page, the sitemap and llms.txt ask here, so a collection is either
 * published everywhere or nowhere.
 */

async function isPublished(slug: string, counts?: Record<string, number>): Promise<boolean> {
  return ((counts ?? (await getCollectionCounts()))[slug] ?? 0) >= MIN_COLLECTION_SHOWS
}

/** Collections with enough shows to be a real landing page. */
export async function publishedCollections(): Promise<CollectionConfig[]> {
  const counts = await getCollectionCounts()
  const published: CollectionConfig[] = []
  for (const c of collections) if (await isPublished(c.slug, counts)) published.push(c)
  return published
}

/** The collection for a landing page, or null when it is unknown or not published. */
export async function getPublishedCollection(slug: string): Promise<CollectionConfig | null> {
  const collection = getCollectionBySlug(slug)
  return collection && (await isPublished(slug)) ? collection : null
}

/** The published collections a show belongs to. */
export async function publishedCollectionsForShow(show: ShowFacts): Promise<CollectionConfig[]> {
  const counts = await getCollectionCounts()
  const matching = collectionsForShow(show)
  const published: CollectionConfig[] = []
  for (const c of matching) if (await isPublished(c.slug, counts)) published.push(c)
  return published
}
