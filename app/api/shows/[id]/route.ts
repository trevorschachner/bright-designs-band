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
  const show = await db.query.shows.findFirst({
    where: eq(shows.id, parseInt(id, 10)),
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
  if (!show) return NextResponse.json(null);

  const { showArrangements: sa = [], ...rest } = show as any;
  const normalized = {
    ...rest,
    arrangements: (sa as any[]).map((item) => item.arrangement).filter(Boolean),
  };
  return NextResponse.json(normalized);
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

  let db: any;
  try {
    ({ db } = await import('@/lib/database'));
  } catch (e) {
    console.error('Database import failed (likely no DATABASE_URL).', e);
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const updatedShow = await db.transaction(async (tx) => {
    const [updated] = await tx.update(shows).set(showData).where(eq(shows.id, parseInt(id, 10))).returning();
    
    await tx.delete(showsToTags).where(eq(showsToTags.showId, updated.id));

    if (tagIds && tagIds.length > 0) {
      await tx.insert(showsToTags).values(
        tagIds.map((tagId: number) => ({
          showId: updated.id,
          tagId,
        }))
      );
    }
    
    return updated;
  });

  return NextResponse.json(updatedShow);
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