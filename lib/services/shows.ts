import { db } from "@/lib/database";
import { shows, showsToTags } from "@/lib/database/schema";
import { eq, desc } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { STORAGE_BUCKET, withRootPrefix } from "@/lib/storage";
import { createClient } from "@supabase/supabase-js";

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
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return null;

  // Direct URL construction is most efficient for public files
  // Format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
  // But using the SDK's getPublicUrl is safer for edge cases
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(withRootPrefix(path));
    
  return data.publicUrl;
}

async function fetchFeaturedShows(): Promise<ShowSummary[]> {
  try {
    // Drizzle query for featured shows
    const result = await db.query.shows.findMany({
      where: eq(shows.featured, true),
      orderBy: [desc(shows.createdAt)],
      limit: 6,
      with: {
        showsToTags: {
          with: {
            tag: true
          }
        }
      }
    });

    // If no featured shows, fallback to latest
    let data = result;
    if (data.length === 0) {
      data = await db.query.shows.findMany({
        orderBy: [desc(shows.createdAt)],
        limit: 6,
        with: {
          showsToTags: {
            with: {
              tag: true
            }
          }
        }
      });
    }

    // Map and resolve URLs
    // Note: getPublicUrl is now synchronous/lightweight
    return data.map((s) => ({
      id: s.id,
      title: s.title,
      slug: s.slug,
      description: s.description,
      year: s.year,
      difficulty: s.difficulty,
      duration: s.duration,
      thumbnailUrl: getPublicUrl(s.thumbnailUrl),
      graphicUrl: getPublicUrl(s.graphicUrl),
      createdAt: s.createdAt,
      showsToTags: s.showsToTags.map((st) => ({
        tag: st.tag
      })),
    }));

  } catch (error) {
    console.error('Error fetching featured shows:', error);
    return [];
  }
}

// Cache the result for 1 hour (3600 seconds)
// Tag 'shows' allows on-demand revalidation when shows are updated
export const getFeaturedShows = unstable_cache(
  fetchFeaturedShows,
  ['featured-shows'],
  { revalidate: 3600, tags: ['shows'] }
);
