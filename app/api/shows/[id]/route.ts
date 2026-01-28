import { shows, showsToTags, showArrangements, arrangementsToTags } from '@/lib/database/schema';
import { eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { withDb } from '@/lib/utils/db';

// Cache show detail responses for 1 hour
export const revalidate = 3600;

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withDb(async (db) => {
    try {
      const idNum = Number.parseInt(id, 10);
      const isNumeric = Number.isFinite(idNum);
      const show = await db.query.shows.findFirst({
        where: isNumeric ? eq(shows.id, idNum) : eq(shows.slug, id),
        // Select all columns including extended fields
        columns: {
          id: true,
          slug: true,
          title: true,
          description: true,
          year: true,
          difficulty: true,
          duration: true,
          thumbnailUrl: true,
          graphicUrl: true,
          videoUrl: true,
          youtubeUrl: true,
          commissioned: true,
          programCoordinator: true,
          percussionArranger: true,
          soundDesigner: true,
          windArranger: true,
          drillWriter: true,
          featured: true,
          displayOrder: true,
          createdAt: true,
          updatedAt: true,
        },
        with: {
          showsToTags: {
            with: {
              tag: true,
            },
          },
          showArrangements: {
            orderBy: [showArrangements.orderIndex],
            with: {
              arrangement: {
                with: {
                  arrangementsToTags: {
                    with: {
                      tag: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
      if (!show) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }

      const { showArrangements: sa = [], ...rest } = show as any;
      const normalized = {
        ...rest,
        arrangements: (sa as any[]).map((item) => {
          const arr = item.arrangement;
          if (!arr) return null;
          
          // Flatten arrangement tags
          const tags = (arr.arrangementsToTags || []).map((at: any) => at.tag);
          
          return {
            ...arr,
            tags,
            arrangementsToTags: undefined, // Remove the junction array
          };
        }).filter(Boolean),
      };
      return NextResponse.json(normalized, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      });
    } catch (e) {
      console.error('Failed to fetch show by id:', e);
      return NextResponse.json({ error: 'Failed to fetch show' }, { status: 500 });
    }
  });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let createClient: any;
  try {
    ({ createClient } = await import('@/lib/utils/supabase/server'));
  } catch (e) {
    console.error('Supabase client import failed.', e);
    return NextResponse.json({ error: 'Auth provider not configured' }, { status: 500 });
  }
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { tags: tagIds, ...showData } = body;
  
  console.log('PUT /api/shows/' + id, 'Received body:', JSON.stringify(body, null, 2));

  // Basic validation for required fields on update
  if ('title' in showData) {
    const t = typeof showData.title === 'string' ? showData.title.trim() : '';
    if (!t) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
  }

  console.log('PUT /api/shows/' + id, 'Received data:', JSON.stringify(showData, null, 2));
  console.log('PUT /api/shows/' + id, 'Tag IDs:', tagIds);

  return withDb(async (db) => {
    try {
      const updatedShow = await db.transaction(async (tx: any) => {
        console.log('PUT /api/shows/' + id, 'Updating show with data:', JSON.stringify(showData, null, 2));

        // First, find the show by ID or slug
        const idNum = Number.parseInt(id, 10);
        const isNumeric = Number.isFinite(idNum);
        
        let showToUpdate: { id: number } | null = null;
        
        if (isNumeric) {
          // If numeric ID, find by ID
          const found = await tx
            .select({ id: shows.id })
            .from(shows)
            .where(eq(shows.id, idNum))
            .limit(1);
          if (Array.isArray(found) && found[0]) {
            showToUpdate = found[0];
          }
        } else {
          // If slug, try exact match first
          let found = await tx
            .select({ id: shows.id })
            .from(shows)
            .where(eq(shows.slug, id))
            .limit(1);
          
          // If not found, try case-insensitive match with underscore/hyphen variations
          if (!found || !Array.isArray(found) || found.length === 0) {
            const result = await tx.execute(sql`
              SELECT id
              FROM shows
              WHERE LOWER(slug) = LOWER(${id})
                 OR LOWER(REPLACE(slug, '_', '-')) = LOWER(REPLACE(${id}, '_', '-'))
                 OR LOWER(REPLACE(slug, '-', '_')) = LOWER(REPLACE(${id}, '-', '_'))
                 OR slug LIKE ${id + '-%'}
              LIMIT 1
            `);
            if (Array.isArray(result) && result.length > 0) {
              found = [{ id: Number((result[0] as any).id) }];
            }
          }
          
          if (Array.isArray(found) && found[0]) {
            showToUpdate = found[0];
          }
        }
        
        if (!showToUpdate) {
          throw new Error('Show not found');
        }
        
        const showId = showToUpdate.id;

        // Compute slug from provided title (server-authoritative)
        const sourceTitle: string | undefined = showData.title as string | undefined;
        const slugFrom = (sourceTitle || '').toString();
        let slug = slugFrom
          ? slugFrom
              .toLowerCase()
              .normalize('NFKD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '')
          : undefined;

        // Ensure slug uniqueness if we are updating it
        if (slug) {
          const existingWithSlug = await tx
            .select({ id: shows.id })
            .from(shows)
            .where(eq(shows.slug, slug))
            .limit(1);
          const conflict = Array.isArray(existingWithSlug) && existingWithSlug[0] && existingWithSlug[0].id !== showId;
          if (conflict) {
            slug = `${slug}-${showId}`;
          }
        }

        const payload = { ...showData, ...(slug ? { slug } : {}) };

        // Update by ID (we now have the actual ID)
        const [updated] = await tx
          .update(shows)
          .set(payload)
          .where(eq(shows.id, showId))
          .returning();
        
        console.log('PUT /api/shows/' + id, 'Update result:', updated ? 'Success' : 'No rows updated');
        console.log('PUT /api/shows/' + id, 'Updated show:', JSON.stringify(updated, null, 2));
        
        if (!updated) {
          throw new Error('Show not found');
        }
        
        await tx.delete(showsToTags).where(eq(showsToTags.showId, updated.id));
        console.log('PUT /api/shows/' + id, 'Deleted existing tags');

        if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
          await tx.insert(showsToTags).values(
            tagIds.map((tagId: number) => ({
              showId: updated.id,
              tagId,
            }))
          );
          console.log('PUT /api/shows/' + id, 'Inserted', tagIds.length, 'tags');
        }
        
        return updated;
      });

      console.log('PUT /api/shows/' + id, 'Transaction completed successfully');
      // @ts-expect-error - revalidateTag expects 1 arg but types mismatch
      revalidateTag('shows');
      return NextResponse.json(updatedShow);
    } catch (error: any) {
      console.error('PUT /api/shows/' + id, 'Error updating show:', error);
      console.error('PUT /api/shows/' + id, 'Error stack:', error?.stack);
      return NextResponse.json({ 
        error: 'Failed to update show', 
        details: error?.message || String(error) 
      }, { status: 500 });
    }
  });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let createClient: any;
  try {
    ({ createClient } = await import('@/lib/utils/supabase/server'));
  } catch (e) {
    console.error('Supabase client import failed.', e);
    return NextResponse.json({ error: 'Auth provider not configured' }, { status: 500 });
  }
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return withDb(async (db) => {
    const idNum = Number.parseInt(id, 10);
    const isNumeric = Number.isFinite(idNum);
    const deletedShow = await db
      .delete(shows)
      .where(isNumeric ? eq(shows.id, idNum) : eq(shows.slug, id))
      .returning();
    // @ts-expect-error - revalidateTag expects 1 arg but types mismatch
    revalidateTag('shows');
    return NextResponse.json(deletedShow);
  });
} 