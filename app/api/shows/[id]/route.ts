import { db } from '@/lib/db';
import { shows, showsToTags } from '@/lib/db/schema';
import { createClient } from '@/utils/supabase/server';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const show = await db.query.shows.findFirst({
    where: eq(shows.id, parseInt(params.id, 10)),
    with: {
      showsToTags: {
        with: {
          tag: true,
        },
      },
      arrangements: true,
    },
  });
  return NextResponse.json(show);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { tags: tagIds, ...showData } = body;

  const updatedShow = await db.transaction(async (tx) => {
    const [updated] = await tx.update(shows).set(showData).where(eq(shows.id, parseInt(params.id, 10))).returning();
    
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

export async function DELETE(request: Request, { params }: { params: { id:string } }) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const deletedShow = await db.delete(shows).where(eq(shows.id, parseInt(params.id, 10))).returning();
  return NextResponse.json(deletedShow);
} 