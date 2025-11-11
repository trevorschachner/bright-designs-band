import { createClient } from '@/lib/utils/supabase/server';
import { NextResponse } from 'next/server';
import { getArrangementById } from '@/lib/database/supabase-queries';
import { arrangements } from '@/lib/database/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data: arrangement, error } = await supabase
      .from('arrangements')
      .select(`
        *,
        show:shows(*),
        files(*)
      `)
      .eq('id', parseInt(id, 10))
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Arrangement not found' }, { status: 404 });
      }
      console.error('Error fetching arrangement:', error);
      return NextResponse.json(
        { error: 'Failed to fetch arrangement' },
        { status: 500 }
      );
    }

    return NextResponse.json(arrangement);
  } catch (error) {
    console.error('Error fetching arrangement:', error);
    return NextResponse.json(
      { error: 'Failed to fetch arrangement' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const arrangementId = parseInt(id, 10);
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is staff
    const userEmail = session.user?.email;
    if (!userEmail?.endsWith('@brightdesigns.band')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    console.log('PUT /api/arrangements/' + arrangementId, 'Received data:', JSON.stringify(body, null, 2));
    
    // Use Drizzle to bypass RLS (like shows route does)
    let db: any;
    try {
      ({ db } = await import('@/lib/database'));
    } catch (e) {
      console.error('Database import failed (likely no DATABASE_URL).', e);
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Convert snake_case to camelCase for Drizzle schema
    const drizzlePayload: any = {};
    if (body.title !== undefined) drizzlePayload.title = body.title;
    if (body.composer !== undefined) drizzlePayload.composer = body.composer;
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
    if (body.copyright_amount_usd !== undefined) drizzlePayload.copyrightAmountUsd = body.copyright_amount_usd;
    if (body.display_order !== undefined) drizzlePayload.displayOrder = body.display_order;

    console.log('PUT /api/arrangements/' + arrangementId, 'Drizzle payload:', JSON.stringify(drizzlePayload, null, 2));

    try {
      const [updatedArrangement] = await db
        .update(arrangements)
        .set(drizzlePayload)
        .where(eq(arrangements.id, arrangementId))
        .returning();

      if (!updatedArrangement) {
        console.error('PUT /api/arrangements/' + arrangementId, 'Update returned no rows');
        return NextResponse.json(
          { error: 'Arrangement not found or update failed' },
          { status: 404 }
        );
      }

      console.log('PUT /api/arrangements/' + arrangementId, 'Successfully updated');
      return NextResponse.json(updatedArrangement);
    } catch (dbError: any) {
      console.error('PUT /api/arrangements/' + arrangementId, 'Database error:', dbError);
      return NextResponse.json(
        { 
          error: 'Failed to update arrangement',
          details: dbError?.message || String(dbError)
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('PUT /api/arrangements/', 'Error updating arrangement:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update arrangement',
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is staff
    const userEmail = session.user?.email;
    if (!userEmail?.endsWith('@brightdesigns.band')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: deletedArrangement, error } = await supabase
      .from('arrangements')
      .delete()
      .eq('id', parseInt(id, 10))
      .select()
      .single();

    if (error) {
      console.error('Error deleting arrangement:', error);
      return NextResponse.json(
        { error: 'Failed to delete arrangement' },
        { status: 500 }
      );
    }

    return NextResponse.json(deletedArrangement);
  } catch (error) {
    console.error('Error deleting arrangement:', error);
    return NextResponse.json(
      { error: 'Failed to delete arrangement' },
      { status: 500 }
    );
  }
} 