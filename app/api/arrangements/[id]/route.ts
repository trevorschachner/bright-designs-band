import { NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { guard } from '@/lib/auth/guard';
import { arrangements, arrangementsToTags, showArrangements } from '@/lib/database/schema';
import { eq, and } from 'drizzle-orm';
import { PUBLIC_CACHE_HEADERS } from '@/lib/utils/api-helpers';
import { getArrangementForApi, getShowSlugForArrangement } from '@/lib/services/arrangements';
import { invalidateArrangement } from '@/lib/services/invalidate';
import { slugOrNull } from '@/lib/services/files';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const arrangementId = Number(id);
    if (!Number.isInteger(arrangementId) || arrangementId <= 0) {
      return NextResponse.json({ error: 'Arrangement not found' }, { status: 404 });
    }

    const arrangement = await getArrangementForApi(arrangementId);
    if (!arrangement) {
      return NextResponse.json({ error: 'Arrangement not found' }, { status: 404 });
    }

    return NextResponse.json(arrangement, { headers: PUBLIC_CACHE_HEADERS });
  } catch (error) {
    console.error('Error fetching arrangement:', error);
    return NextResponse.json({ error: 'Failed to fetch arrangement' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const arrangementId = parseInt(id, 10);
    const gate = await guard('canEditArrangements');
    if (gate.denied) return gate.denied;

    const body = await request.json();
    console.log('PUT /api/arrangements/' + arrangementId, 'Received data:', JSON.stringify(body, null, 2));
    
    // Use Drizzle to bypass RLS (like shows route does)

    // Convert snake_case to camelCase for Drizzle schema
    const drizzlePayload: any = {};
    if (body.title !== undefined) drizzlePayload.title = body.title;
    if (body.composer !== undefined) drizzlePayload.composer = body.composer;
    if (body.arranger !== undefined) drizzlePayload.arranger = body.arranger;
    if (body.percussion_arranger !== undefined) drizzlePayload.percussionArranger = body.percussion_arranger;
    if (body.description !== undefined) drizzlePayload.description = body.description;
    if (body.grade !== undefined) drizzlePayload.grade = body.grade;
    if (body.year !== undefined) drizzlePayload.year = body.year;
    if (body.duration_seconds !== undefined) drizzlePayload.durationSeconds = body.duration_seconds;
    if (body.scene !== undefined) drizzlePayload.scene = body.scene;
    if (body.ensemble_size !== undefined) drizzlePayload.ensembleSize = body.ensemble_size;
    if (body.youtube_url !== undefined) drizzlePayload.youtubeUrl = body.youtube_url;
    if (body.commissioned !== undefined) drizzlePayload.commissioned = body.commissioned;
    if (body.sample_score_url !== undefined) drizzlePayload.sampleScoreUrl = body.sample_score_url;
    if (body.display_order !== undefined) drizzlePayload.displayOrder = body.display_order;

    console.log('PUT /api/arrangements/' + arrangementId, 'Drizzle payload:', JSON.stringify(drizzlePayload, null, 2));

    const tagIds = body.tags;
    const showId = body.show_id;

    try {
      const updatedArrangement = await db.transaction(async (tx: any) => {
        const [updated] = await tx
          .update(arrangements)
          .set(drizzlePayload)
          .where(eq(arrangements.id, arrangementId))
          .returning();

        if (!updated) {
          throw new Error('Arrangement not found or update failed');
        }

        // Update order in show_arrangements if showId and displayOrder are provided
        if (showId && drizzlePayload.displayOrder !== undefined) {
          await tx
            .update(showArrangements)
            .set({ orderIndex: drizzlePayload.displayOrder })
            .where(
              and(
                eq(showArrangements.showId, Number(showId)),
                eq(showArrangements.arrangementId, arrangementId)
              )
            );
        }

        if (tagIds && Array.isArray(tagIds)) {
          // Delete existing tags
          await tx.delete(arrangementsToTags).where(eq(arrangementsToTags.arrangementId, arrangementId));
          
          // Insert new tags
          if (tagIds.length > 0) {
            await tx.insert(arrangementsToTags).values(
              tagIds.map((tagId: number) => ({
                arrangementId,
                tagId,
              }))
            );
          }
        }
        
        return updated;
      });

      console.log('PUT /api/arrangements/' + arrangementId, 'Successfully updated');
      // A failed slug lookup must not skip invalidation (or fail a committed write).
      invalidateArrangement(arrangementId, await slugOrNull(() => getShowSlugForArrangement(arrangementId)));
      return NextResponse.json(updatedArrangement);
    } catch (dbError: any) {
      console.error('PUT /api/arrangements/' + arrangementId, 'Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to update arrangement' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('PUT /api/arrangements/', 'Error updating arrangement:', error);
    return NextResponse.json(
      { error: 'Failed to update arrangement' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const gate = await guard('canDeleteArrangements');
    if (gate.denied) return gate.denied;

    const { db } = await import('@/lib/database');
    const arrangementId = parseInt(id, 10);
    // Read before the delete: the cascade removes the link to the show.
    const showSlug = await getShowSlugForArrangement(arrangementId);
    const [deleted] = await db
      .delete(arrangements)
      .where(eq(arrangements.id, arrangementId))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Arrangement not found' }, { status: 404 });
    }

    invalidateArrangement(deleted.id, showSlug);
    return NextResponse.json(deleted);
  } catch (error) {
    console.error('Error deleting arrangement:', error);
    return NextResponse.json({ error: 'Failed to delete arrangement' }, { status: 500 });
  }
} 