import { shows, showsToTags, showArrangements } from '@/lib/database/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let db: any;
  try {
    ({ db } = await import('@/lib/database'));
  } catch (e) {
    console.error('Database import failed (likely no DATABASE_URL).', e);
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }
  try {
    const show = await db.query.shows.findFirst({
      where: eq(shows.id, parseInt(id, 10)),
      // Select all columns including extended fields
      columns: {
        id: true,
        name: true,
        title: true,
        description: true,
        year: true,
        difficulty: true,
        duration: true,
        thumbnailUrl: true,
        videoUrl: true,
        youtubeUrl: true,
        commissioned: true,
        programCoordinator: true,
        percussionArranger: true,
        soundDesigner: true,
        windArranger: true,
        drillWriter: true,
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
            arrangement: true,
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
      arrangements: (sa as any[]).map((item) => item.arrangement).filter(Boolean),
    };
    return NextResponse.json(normalized);
  } catch (e) {
    console.error('Failed to fetch show by id:', e);
    return NextResponse.json({ error: 'Failed to fetch show' }, { status: 500 });
  }
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

  console.log('PUT /api/shows/' + id, 'Received data:', JSON.stringify(showData, null, 2));
  console.log('PUT /api/shows/' + id, 'Tag IDs:', tagIds);

  let db: any;
  try {
    ({ db } = await import('@/lib/database'));
  } catch (e) {
    console.error('Database import failed (likely no DATABASE_URL).', e);
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  try {
    const updatedShow = await db.transaction(async (tx: any) => {
      console.log('PUT /api/shows/' + id, 'Updating show with data:', JSON.stringify(showData, null, 2));
      
      const [updated] = await tx.update(shows).set(showData).where(eq(shows.id, parseInt(id, 10))).returning();
      
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
    return NextResponse.json(updatedShow);
  } catch (error: any) {
    console.error('PUT /api/shows/' + id, 'Error updating show:', error);
    console.error('PUT /api/shows/' + id, 'Error stack:', error?.stack);
    return NextResponse.json({ 
      error: 'Failed to update show', 
      details: error?.message || String(error) 
    }, { status: 500 });
  }
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

  let db: any;
  try {
    ({ db } = await import('@/lib/database'));
  } catch (e) {
    console.error('Database import failed (likely no DATABASE_URL).', e);
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }
  const deletedShow = await db.delete(shows).where(eq(shows.id, parseInt(id, 10))).returning();
  return NextResponse.json(deletedShow);
} 