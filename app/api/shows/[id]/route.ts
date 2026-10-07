import { shows, showsToTags, showArrangements } from '@/lib/database/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { guard } from '@/lib/auth/guard';
import { revalidateTag } from 'next/cache';
import { withDb } from '@/lib/utils/db';
import { updateShowSchema } from '@/lib/validation/shows';
import { BadRequestResponse, ErrorResponse, NotFoundResponse } from '@/lib/utils/api-helpers';

/**
 * Never cached. The only reader is the admin editor (`app/admin/shows/[id]`),
 * which loads this when a show is opened and PUTs the whole snapshot back on
 * auto-save. It used to be served from the CDN for an hour, so a thumbnail
 * saved a moment earlier was missing when the editor was reopened, and the
 * next auto-save wrote the stale copy back over it. Public pages read shows
 * through `lib/services/shows.ts`, which has its own tagged cache.
 */
export const dynamic = 'force-dynamic';

/**
 * A route `id` is either a numeric primary key or an exact slug. There is no
 * fuzzy fallback: the old `slug LIKE '<id>-%'` match could resolve to, and then
 * update, a different show. All digits means id, so a slug that starts with a
 * number (`1984-show`) is still looked up as a slug.
 */
function showWhere(id: string) {
  return /^\d+$/.test(id) ? eq(shows.id, Number(id)) : eq(shows.slug, id);
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withDb(async (db) => {
    try {
      const show = await db.query.shows.findFirst({
        where: showWhere(id),
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
        headers: { 'Cache-Control': 'private, no-store' },
      });
    } catch (e) {
      console.error('Failed to fetch show by id:', e);
      return NextResponse.json({ error: 'Failed to fetch show' }, { status: 500 });
    }
  });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gate = await guard('canManageShows');
  if (gate.denied) return gate.denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return BadRequestResponse([{ path: [], message: 'Body must be valid JSON' }]);
  }

  const parsed = updateShowSchema.safeParse(body);
  if (!parsed.success) {
    return BadRequestResponse(
      parsed.error.issues.map(issue => ({ path: issue.path, message: issue.message }))
    );
  }

  const { tags: tagIds, ...fields } = parsed.data;

  return withDb(async (db) => {
    try {
      const result = await db.transaction(async (tx: any) => {
        const [found] = await tx.select({ id: shows.id }).from(shows).where(showWhere(id)).limit(1);
        if (!found) return { status: 'not_found' as const };
        const showId: number = found.id;

        if (fields.slug !== undefined) {
          const [holder] = await tx
            .select({ id: shows.id })
            .from(shows)
            .where(eq(shows.slug, fields.slug))
            .limit(1);
          if (holder && holder.id !== showId) return { status: 'slug_taken' as const };
        }

        const [updated] = await tx
          .update(shows)
          .set({ ...fields, updatedAt: new Date() })
          .where(eq(shows.id, showId))
          .returning();

        if (tagIds !== undefined) {
          await tx.delete(showsToTags).where(eq(showsToTags.showId, showId));
          const unique = [...new Set(tagIds)];
          if (unique.length > 0) {
            await tx.insert(showsToTags).values(unique.map(tagId => ({ showId, tagId })));
          }
        }

        return { status: 'ok' as const, updated };
      });

      if (result.status === 'not_found') return NotFoundResponse('Show');
      if (result.status === 'slug_taken') return ErrorResponse('Slug is already in use', 409);

      // @ts-expect-error - revalidateTag expects 1 arg but types mismatch
      revalidateTag('shows');
      return NextResponse.json(result.updated);
    } catch (error) {
      // The slug check above can lose a race with a concurrent write; the
      // unique index is the backstop.
      if ((error as { code?: string })?.code === '23505') {
        return ErrorResponse('Slug is already in use', 409);
      }
      console.error(`PUT /api/shows/${id} failed:`, error instanceof Error ? error.message : String(error));
      return ErrorResponse('Failed to update show');
    }
  });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gate = await guard('canManageShows');
  if (gate.denied) return gate.denied;

  return withDb(async (db) => {
    const deletedShow = await db.delete(shows).where(showWhere(id)).returning();
    if (!Array.isArray(deletedShow) || deletedShow.length === 0) {
      return NotFoundResponse('Show');
    }
    // @ts-expect-error - revalidateTag expects 1 arg but types mismatch
    revalidateTag('shows');
    return NextResponse.json(deletedShow);
  });
}
