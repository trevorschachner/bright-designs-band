import { db } from "@/lib/database";
import { shows, showsToTags, files, tags } from "@/lib/database/schema";
import { eq, desc, notInArray, and } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { STORAGE_BUCKET, withRootPrefix } from "@/lib/storage";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig, shouldSkipSupabase } from "@/lib/env";

export type ShowSummary = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  year: number | null;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | null;
  duration: string | null;
  thumbnailUrl: string | null;
  graphicUrl: string | null;
  createdAt: Date;
  showsToTags: { tag: { id: number; name: string } }[];
  arrangements: { id: number; title: string | null; scene: string | null }[];
};

// Helper to convert storage paths to public URLs
// Using a lightweight client without cookies for cache compatibility
function getPublicUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  if (shouldSkipSupabase()) return null;
  
  const { url: supabaseUrl, key: supabaseKey } = getSupabaseConfig();

  if (!supabaseUrl || !supabaseKey) return null;

  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(withRootPrefix(path));
    
  return data.publicUrl;
}

export async function fetchFeaturedShows(): Promise<ShowSummary[]> {
  // Drizzle query for featured shows
  let result = await db.query.shows.findMany({
    where: eq(shows.featured, true),
    orderBy: [desc(shows.createdAt)],
    limit: 6,
    with: {
      showsToTags: {
        with: {
          tag: true
        }
      },
      showArrangements: {
        orderBy: (showArrangements, { asc }) => [asc(showArrangements.orderIndex)],
        with: {
          arrangement: {
            columns: {
              id: true,
              title: true,
              scene: true,
            }
          }
        }
      },
      files: {
        where: (files, { eq }) => eq(files.fileType, 'image'),
        limit: 1
      }
    }
  });

  // Map and resolve URLs
  // Note: getPublicUrl is now synchronous/lightweight
  // If fewer than 3 featured shows, we consider the section empty
  if (result.length < 3) {
    return [];
  }

  return result.map((s) => {
    // Fallback to first image file if graphicUrl/thumbnailUrl is missing
    const fallbackImage = s.files && s.files.length > 0 ? s.files[0].storagePath : null;
    
    return {
      id: s.id,
      title: s.title,
      slug: s.slug,
      description: s.description,
      year: s.year,
      difficulty: s.difficulty,
      duration: s.duration,
      thumbnailUrl: getPublicUrl(s.thumbnailUrl || fallbackImage),
      graphicUrl: getPublicUrl(s.graphicUrl || fallbackImage),
      createdAt: s.createdAt,
      showsToTags: s.showsToTags.map((st) => ({
        tag: st.tag
      })),
      arrangements: s.showArrangements.map(sa => sa.arrangement).filter(Boolean),
    };
  });
}

const getFeaturedShowsCached = unstable_cache(
  fetchFeaturedShows,
  ['featured-shows'],
  { revalidate: 3600, tags: ['shows'] }
);

export async function getFeaturedShows(): Promise<ShowSummary[]> {
  if (shouldSkipSupabase()) {
    console.warn('[getFeaturedShows] Skipping Supabase fetch during masked Netlify build.');
    return [];
  }
  try {
    return await getFeaturedShowsCached();
  } catch (error) {
    console.error('Error fetching featured shows (cached):', error);
    return [];
  }
}

// Fetch shows for collections/landing pages
async function fetchShowsByFilter(filter: { difficulty?: 'Beginner' | 'Intermediate' | 'Advanced'; tag?: string }): Promise<ShowSummary[]> {
  // Drizzle is type-safe but filtering on relations in findMany 'where' clause is complex.
  // Instead we'll use query builder approach or raw filters if possible.
  
  // Simplest approach: Fetch matches first then join, or use db.query with where clause
  
  // If filtering by tag, we need to find showIds that have that tag
  let tagShowIds: number[] | null = null;
  if (filter.tag) {
    const tagRecord = await db.query.tags.findFirst({
      where: eq(tags.name, filter.tag)
    });
    
    if (tagRecord) {
      const relations = await db.query.showsToTags.findMany({
        where: eq(showsToTags.tagId, tagRecord.id)
      });
      tagShowIds = relations.map(r => r.showId);
    } else {
      // Tag not found, so no shows match
      return [];
    }
  }

  // Build query conditions
  const conditions = [];
  if (filter.difficulty) {
    conditions.push(eq(shows.difficulty, filter.difficulty));
  }
  
  // If tag filter was active
  if (filter.tag) {
    // If we found shows with the tag, filter by ID
    if (tagShowIds && tagShowIds.length > 0) {
      // Drizzle inArray requires non-empty array
      // We can't import inArray easily here without potentially breaking types if versions mismatch, 
      // but let's assume 'inArray' is available from drizzle-orm if we add it to imports.
      // Actually, importing 'inArray' from drizzle-orm is safe.
      const { inArray } = await import("drizzle-orm");
      conditions.push(inArray(shows.id, tagShowIds));
    } else {
      return []; // Should have been caught above, but safety check
    }
  }

  let result = await db.query.shows.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [desc(shows.createdAt)],
    limit: 12, // Limit for landing pages
    with: {
      showsToTags: {
        with: {
          tag: true
        }
      },
      showArrangements: {
        orderBy: (showArrangements, { asc }) => [asc(showArrangements.orderIndex)],
        with: {
          arrangement: {
            columns: {
              id: true,
              title: true,
              scene: true,
            }
          }
        }
      },
      files: {
        where: (files, { eq }) => eq(files.fileType, 'image'),
        limit: 1
      }
    }
  });

  return result.map((s) => {
    const fallbackImage = s.files && s.files.length > 0 ? s.files[0].storagePath : null;
    return {
      id: s.id,
      title: s.title,
      slug: s.slug,
      description: s.description,
      year: s.year,
      difficulty: s.difficulty,
      duration: s.duration,
      thumbnailUrl: getPublicUrl(s.thumbnailUrl || fallbackImage),
      graphicUrl: getPublicUrl(s.graphicUrl || fallbackImage),
      createdAt: s.createdAt,
      showsToTags: s.showsToTags.map((st) => ({
        tag: st.tag
      })),
      arrangements: s.showArrangements.map(sa => sa.arrangement).filter(Boolean),
    };
  });
}

// Cache the collection fetcher
export async function getShowsByFilter(filter: { difficulty?: 'Beginner' | 'Intermediate' | 'Advanced'; tag?: string }): Promise<ShowSummary[]> {
  const keyParts = [];
  if (filter.difficulty) keyParts.push(`diff:${filter.difficulty}`);
  if (filter.tag) keyParts.push(`tag:${filter.tag}`);
  const cacheKey = `collection-shows-${keyParts.join('-')}`;

  const cachedFn = unstable_cache(
    () => fetchShowsByFilter(filter),
    [cacheKey],
    { revalidate: 3600, tags: ['shows'] }
  );

  if (shouldSkipSupabase()) {
    return [];
  }
  
  try {
    return await cachedFn();
  } catch (error) {
    console.error('Error fetching collection shows (cached):', error);
    return [];
  }
}
