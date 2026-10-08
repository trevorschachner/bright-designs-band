// Database query functions - proper way to use Drizzle
import { db } from './index';
import { shows, arrangements, files, tags, contactSubmissions, showArrangements, pieces, arrangementPieces } from './schema';
import { eq, desc, and, or, ilike, count, sql, inArray } from 'drizzle-orm';
import type { PublicPiece } from '@/lib/pieces/credits';

// =======================================
// SHOWS QUERIES
// =======================================

export async function getShowWithTagsBySlug(slug: string) {
  try {
    // Try exact match first (most common case, fastest)
    let show = await db.query.shows.findFirst({
      where: eq(shows.slug, slug),
      with: {
        showsToTags: {
          with: {
            tag: true,
          },
        },
      },
    });

    // If not found, try case-insensitive match with underscore/hyphen variations using SQL
    if (!show) {
      // Use SQL to handle case-insensitive matching and underscore/hyphen variations efficiently
      // This is much faster than fetching all shows
      const result = await db.execute(sql`
        SELECT s.id
        FROM shows s
        WHERE LOWER(s.slug) = LOWER(${slug})
           OR LOWER(REPLACE(s.slug, '_', '-')) = LOWER(REPLACE(${slug}, '_', '-'))
           OR LOWER(REPLACE(s.slug, '-', '_')) = LOWER(REPLACE(${slug}, '-', '_'))
        LIMIT 1
      `);

      let matchedId: number | null = null;
      if (Array.isArray(result) && result.length > 0) {
        matchedId = Number((result[0] as any).id) || null;
      } else if (result && typeof result === 'object' && 'rows' in result && (result as any).rows.length > 0) {
        matchedId = Number((result as any).rows[0].id) || null;
      }

      if (matchedId) {
        show = await db.query.shows.findFirst({
          where: eq(shows.id, matchedId),
          with: {
            showsToTags: {
              with: {
                tag: true,
              },
            },
          },
        });
      }
    }

    if (!show) {
      return null;
    }

    const { showsToTags: tagRelations = [], ...rest } = show as any;

    const showsToTagsFormatted = Array.isArray(tagRelations)
      ? tagRelations
          .map((relation: any) => ({
            tag: relation?.tag ?? null,
          }))
          .filter((relation) => relation.tag)
      : [];

    return {
      show: rest,
      showsToTags: showsToTagsFormatted,
    };
  } catch (error) {
    console.error('Error fetching show by slug:', error);
    throw error;
  }
}

// =======================================
// ARRANGEMENTS QUERIES
// =======================================

// =======================================
// FILES QUERIES
// =======================================

export async function getPublicFilesByShowId(showId: number) {
  try {
    return await db
      .select()
      .from(files)
      .where(and(
        eq(files.showId, showId),
        eq(files.isPublic, true)
      ))
      .orderBy(files.displayOrder);
  } catch (error) {
    console.error('Error fetching public files:', error);
    throw error;
  }
}

export async function getFilesByArrangementId(arrangementId: number) {
  try {
    return await db
      .select()
      .from(files)
      .where(and(
        eq(files.arrangementId, arrangementId),
        eq(files.isPublic, true)
      ))
      .orderBy(files.displayOrder);
  } catch (error: any) {
    console.error('Error fetching arrangement files:', {
      arrangementId,
      error: error?.message || error,
      stack: error?.stack,
      code: error?.code,
      detail: error?.detail,
    });
    // Return empty array instead of throwing to prevent page crashes
    return [];
  }
}

/**
 * Ordered source pieces for each part, keyed by arrangement id. Selects only
 * title and composer: copyright cost and licensing status are internal. Goes
 * through Drizzle because RLS gives the anon role no access to pieces.
 */
export async function getPublicPiecesByArrangementIds(
  arrangementIds: number[]
): Promise<Map<number, PublicPiece[]>> {
  const byArrangement = new Map<number, PublicPiece[]>();
  if (arrangementIds.length === 0) return byArrangement;
  try {
    const rows = await db
      .select({
        arrangementId: arrangementPieces.arrangementId,
        title: pieces.title,
        composer: pieces.composer,
      })
      .from(arrangementPieces)
      .innerJoin(pieces, eq(arrangementPieces.pieceId, pieces.id))
      .where(inArray(arrangementPieces.arrangementId, arrangementIds))
      .orderBy(arrangementPieces.arrangementId, arrangementPieces.orderIndex);

    for (const { arrangementId, title, composer } of rows) {
      const list = byArrangement.get(arrangementId) ?? [];
      list.push({ title, composer });
      byArrangement.set(arrangementId, list);
    }
  } catch (error: any) {
    // The credit is optional; a failure should not take the page down.
    console.error('Error fetching arrangement pieces:', {
      arrangementIds,
      error: error?.message || error,
    });
  }
  return byArrangement;
}

/**
 * Optimized query: Fetch show with arrangements and their files in a single query
 * This eliminates N+1 queries by using JOINs to fetch all data at once
 */
export async function getShowWithArrangementsAndFiles(showId: number) {
  try {
    // Single optimized query using LEFT JOIN to get all arrangements with their files
    const result = await db.execute(sql`
      SELECT 
        -- Arrangement fields
        a.id as arrangement_id,
        a.title as arrangement_title,
        a.scene,
        a.composer,
        a.arranger,
        a.grade,
        a.year as arrangement_year,
        a.duration_seconds,
        a.description as arrangement_description,
        a.percussion_arranger,
        a.ensemble_size,
        a.youtube_url as arrangement_youtube_url,
        a.commissioned as arrangement_commissioned,
        a.sample_score_url,
        sa.order_index,
        -- File fields (may be NULL if arrangement has no files)
        f.id as file_id,
        f.file_name,
        f.original_name,
        f.file_type,
        f.file_size,
        f.mime_type,
        f.url as file_url,
        f.storage_path,
        f.is_public,
        f.description as file_description,
        f.display_order as file_display_order
      FROM show_arrangements sa
      INNER JOIN arrangements a ON sa.arrangement_id = a.id
      LEFT JOIN files f ON f.arrangement_id = a.id AND f.is_public = true
      WHERE sa.show_id = ${showId}
      ORDER BY sa.order_index, f.display_order
    `);

    // Parse the result
    let rows: any[];
    if (Array.isArray(result)) {
      rows = result;
    } else if (result && typeof result === 'object' && 'rows' in result) {
      rows = (result as any).rows;
    } else {
      rows = [];
    }

    // Group files by arrangement
    const arrangementMap = new Map<number, any>();

    for (const row of rows) {
      const arrId = row.arrangement_id;
      
      if (!arrangementMap.has(arrId)) {
        arrangementMap.set(arrId, {
          id: arrId,
          title: row.arrangement_title,
          scene: row.scene,
          composer: row.composer,
          arranger: row.arranger,
          grade: row.grade,
          year: row.arrangement_year,
          durationSeconds: row.duration_seconds,
          description: row.arrangement_description || '',
          percussionArranger: row.percussion_arranger,
          ensembleSize: row.ensemble_size,
          youtubeUrl: row.arrangement_youtube_url,
          commissioned: row.arrangement_commissioned,
          sampleScoreUrl: row.sample_score_url,
          orderIndex: row.order_index ?? 0,
          files: [],
        });
      }

      // Add file if it exists
      if (row.file_id) {
        const arrangement = arrangementMap.get(arrId)!;
        arrangement.files.push({
          id: row.file_id,
          fileName: row.file_name,
          originalName: row.original_name,
          fileType: row.file_type,
          fileSize: row.file_size,
          mimeType: row.mime_type,
          url: row.file_url,
          storagePath: row.storage_path,
          isPublic: row.is_public,
          description: row.file_description,
          displayOrder: row.file_display_order,
        });
      }
    }

    // Convert map to array and find audio URL for each arrangement
    return Array.from(arrangementMap.values()).map((arr) => {
      const audioFile = arr.files.find((f: any) => f.fileType === 'audio');
      return {
        ...arr,
        audioUrl: audioFile?.url || null,
      };
    });
  } catch (error: any) {
    console.error('Error fetching show with arrangements and files:', {
      showId,
      error: error?.message || error,
    });
    return [];
  }
}

// =======================================
// TAGS QUERIES
// =======================================

// =======================================
// STATISTICS QUERIES
// =======================================

export async function getDashboardStats() {
  try {
    const [showCount] = await db.select({ count: count() }).from(shows);
    const [arrangementCount] = await db.select({ count: count() }).from(arrangements);
    const [contactCount] = await db.select({ count: count() }).from(contactSubmissions);
    const [fileCount] = await db.select({ count: count() }).from(files);
    const [tagCount] = await db.select({ count: count() }).from(tags);

    return {
      totalShows: showCount.count,
      totalArrangements: arrangementCount.count,
      totalContacts: contactCount.count,
      totalFiles: fileCount.count,
      totalTags: tagCount.count,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
}

// =======================================
// CONTACT SUBMISSIONS QUERIES
// =======================================

export async function createContactSubmission(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  service: string;
  message: string;
  source?: string;
  privacyAgreed: boolean;
  ipAddress?: string;
  userAgent?: string;
  interestedShowId?: number;
  interestedArrangementId?: number;
}) {
  try {
    const result = await db
      .insert(contactSubmissions)
      .values({
        ...data,
        source: data.source ?? 'contact',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    return result[0];
  } catch (error) {
    console.error('Error creating contact submission:', error);
    throw error;
  }
}

export async function getContactSubmissions(limit = 50) {
  try {
    return await db
      .select()
      .from(contactSubmissions)
      .orderBy(desc(contactSubmissions.createdAt))
      .limit(limit);
  } catch (error) {
    console.error('Error fetching contact submissions:', error);
    throw error;
  }
}

export async function updateContactSubmissionStatus(
  id: number, 
  status: string, 
  adminNotes?: string
) {
  try {
    const result = await db
      .update(contactSubmissions)
      .set({
        status,
        adminNotes,
        updatedAt: new Date(),
      })
      .where(eq(contactSubmissions.id, id))
      .returning();
    
    return result[0];
  } catch (error) {
    console.error('Error updating contact submission:', error);
    throw error;
  }
}
