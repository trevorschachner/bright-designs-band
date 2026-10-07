import { tags } from '@/lib/database/schema';
import { NextResponse } from 'next/server';
import { guard } from '@/lib/auth/guard';
import { tagInputSchema } from '@/lib/validation/tags';
import { PRIVATE_HEADERS, PUBLIC_CACHE_HEADERS } from '@/lib/utils/api-helpers';
import { getAllTags, getTagsForAdmin } from '@/lib/services/tags';
import { invalidateTags } from '@/lib/services/invalidate';

/**
 * Every tag, cached. The admin tags page asks with ?admin=true and gets an
 * uncached, private read so it sees its own writes. Same body either way.
 */
export async function GET(request: Request) {
  try {
    if (new URL(request.url).searchParams.get('admin') === 'true') {
      const gate = await guard('canManageTags');
      if (!gate.denied) {
        return NextResponse.json(await getTagsForAdmin(), { headers: PRIVATE_HEADERS });
      }
    }
    return NextResponse.json(await getAllTags(), { headers: PUBLIC_CACHE_HEADERS });
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
  invalidateTags();
  return NextResponse.json(newTag);
} 