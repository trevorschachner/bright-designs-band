import { db } from "@/lib/database";
import { shows, showsToTags, files } from "@/lib/database/schema";
import { eq, desc, notInArray } from "drizzle-orm";
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

async function fetchFeaturedShows(): Promise<ShowSummary[]> {
  try {
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
      };
    });

  } catch (error) {
    console.error('Error fetching featured shows:', error);
    return [];
  }
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
  return getFeaturedShowsCached();
}
