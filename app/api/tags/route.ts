import { tags } from '@/lib/database/schema';
import { NextResponse } from 'next/server';
import { guard } from '@/lib/auth/guard';
import { tagInputSchema } from '@/lib/validation/tags';
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
  const gate = await guard('canManageTags');
  if (gate.denied) return gate.denied;

  let db: any;
  try {
    ({ db } = await import('@/lib/database'));
  } catch (e) {
    console.error('Database import failed (likely no DATABASE_URL).', e);
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const parsed = tagInputSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Bad request', details: parsed.error.flatten() }, { status: 400 });
  }

  const newTag = await db.insert(tags).values(parsed.data).returning();
  // @ts-expect-error - revalidateTag expects 1 arg but types mismatch
  revalidateTag('tags');
  return NextResponse.json(newTag);
} 