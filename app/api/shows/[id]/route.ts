import { db } from '@/lib/database';
import { shows, showsToTags } from '@/lib/database/schema';
import { createClient } from '@/lib/utils/supabase/server';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const show = await db.query.shows.findFirst({
    where: eq(shows.id, parseInt(id, 10)),
    with: {
      showsToTags: {
        with: {
          tag: true,
        },
      },
      arrangements: {
        orderBy: [
          { asc: (arrangements) => arrangements.displayOrder },
          { asc: (arrangements) => arrangements.title },
        ] as any
      },
    },
  });
  return NextResponse.json(show);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { tags: tagIds, ...showData } = body;

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
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const deletedShow = await db.delete(shows).where(eq(shows.id, parseInt(id, 10))).returning();
  return NextResponse.json(deletedShow);
} 