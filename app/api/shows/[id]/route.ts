import { shows, showsToTags } from '@/lib/database/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { guard } from '@/lib/auth/guard';
import { withDb } from '@/lib/utils/db';
import { updateShowSchema } from '@/lib/validation/shows';
import {
  BadRequestResponse,
  ErrorResponse,
  NotFoundResponse,
  PUBLIC_CACHE_HEADERS,
  PRIVATE_HEADERS,
} from '@/lib/utils/api-helpers';
import { getShowForAdmin, getShowForApi, showWhere } from '@/lib/services/shows';
import { invalidateShow } from '@/lib/services/invalidate';

/**
 * Public detail, cached (lib/services/shows). The admin edit page asks with
 * ?admin=true: staff then get an uncached, private read so they see their own
 * writes; anyone else gets the public answer.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    if (new URL(request.url).searchParams.get('admin') === 'true') {
      const gate = await guard('canManageShows');
      if (!gate.denied) {
        const show = await getShowForAdmin(id);
        if (!show) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: PRIVATE_HEADERS });
        return NextResponse.json(show, { headers: PRIVATE_HEADERS });
      }
    }

    const show = await getShowForApi(id);
    if (!show) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(show, { headers: PUBLIC_CACHE_HEADERS });
  } catch (e) {
    console.error('Failed to fetch show by id:', e);
    return NextResponse.json({ error: 'Failed to fetch show' }, { status: 500 });
  }
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
        const [found] = await tx.select({ id: shows.id, slug: shows.slug }).from(shows).where(showWhere(id)).limit(1);
        if (!found) return { status: 'not_found' as const };
        const showId: number = found.id;
        const previousSlug: string = found.slug;

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

        return { status: 'ok' as const, updated, previousSlug };
      });

      if (result.status === 'not_found') return NotFoundResponse('Show');
      if (result.status === 'slug_taken') return ErrorResponse('Slug is already in use', 409);

      invalidateShow(result.updated.id, result.updated.slug, result.previousSlug);
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
    invalidateShow(deletedShow[0].id, deletedShow[0].slug);
    return NextResponse.json(deletedShow);
  });
}
