import { db } from "@/lib/database";
import { shows, showsToTags, files } from "@/lib/database/schema";
import { eq, desc, notInArray } from "drizzle-orm";
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
  
  const envSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseUrl = (envSupabaseUrl && envSupabaseUrl !== '****') ? envSupabaseUrl : null;
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

    // If less than 6 shows, fill with latest non-featured shows
    if (result.length < 6) {
      const existingIds = result.map(s => s.id);
      const limit = 6 - result.length;
      
      const moreShows = await db.query.shows.findMany({
        where: existingIds.length > 0 ? notInArray(shows.id, existingIds) : undefined,
        orderBy: [desc(shows.createdAt)],
        limit: limit,
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
      
      result = [...result, ...moreShows];
    }

    // Map and resolve URLs
    // Note: getPublicUrl is now synchronous/lightweight
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

// Cache the result for 1 hour (3600 seconds)
// Tag 'shows' allows on-demand revalidation when shows are updated
export const getFeaturedShows = unstable_cache(
  fetchFeaturedShows,
  ['featured-shows'],
  { revalidate: 3600, tags: ['shows'] }
);
