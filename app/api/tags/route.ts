import { tags } from '@/lib/database/schema';
import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

// Cache tags for 2 hours (tags rarely change)
export const revalidate = 7200;

export async function GET() {
  try {
    let db: any;
    try {
      ({ db } = await import('@/lib/database'));
    } catch (e) {
      console.error('Database import failed (likely no DATABASE_URL).', e);
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }
    const allTags = await db.query.tags.findMany();
    return NextResponse.json(allTags, {
      headers: {
        'Cache-Control': 'public, s-maxage=7200, stale-while-revalidate=14400',
      },
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

  const body = await request.json();
  const newTag = await db.insert(tags).values(body).returning();
  // @ts-expect-error - revalidateTag expects 1 arg but types mismatch
  revalidateTag('tags');
  return NextResponse.json(newTag);
} 