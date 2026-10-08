import { tags } from '@/lib/database/schema';
import { NextResponse } from 'next/server';
import { guard } from '@/lib/auth/guard';
import { PRIVATE_HEADERS, PUBLIC_CACHE_HEADERS } from '@/lib/utils/api-helpers';
import { getAllTags, getTagsForAdmin } from '@/lib/services/tags';

/**
 * Every tag, cached. The admin tags page asks with ?admin=true and gets an
 * uncached, private read so it sees its own writes. Same body either way.
 */
export async function GET(request: Request) {
  try {
    if (new URL(request.url).searchParams.get('admin') === 'true') {
      // Always private, whether or not the guard passes: the edge must never
      // store a body under the URL the admin tags page reads.
      const gate = await guard('canManageTags');
      const data = gate.denied ? await getAllTags() : await getTagsForAdmin();
      return NextResponse.json(data, { headers: PRIVATE_HEADERS });
    }
    return NextResponse.json(await getAllTags(), { headers: PUBLIC_CACHE_HEADERS });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}
