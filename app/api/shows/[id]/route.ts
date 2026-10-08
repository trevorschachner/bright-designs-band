import { shows } from '@/lib/database/schema';
import { NextResponse } from 'next/server';
import { guard } from '@/lib/auth/guard';
import { PUBLIC_CACHE_HEADERS, PRIVATE_HEADERS } from '@/lib/utils/api-helpers';
import { getShowForAdmin, getShowForApi } from '@/lib/services/shows';

/**
 * Public detail, cached (lib/services/shows). The admin edit page asks with
 * ?admin=true: staff then get an uncached read so they see their own writes,
 * anyone else the public data; both privately (never edge-cached).
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    if (new URL(request.url).searchParams.get('admin') === 'true') {
      // Always private, whether or not the guard passes: the edge must never
      // store a body under the URL the admin editor reads.
      const gate = await guard('canManageShows');
      const show = gate.denied ? await getShowForApi(id) : await getShowForAdmin(id);
      if (!show) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: PRIVATE_HEADERS });
      return NextResponse.json(show, { headers: PRIVATE_HEADERS });
    }

    const show = await getShowForApi(id);
    if (!show) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(show, { headers: PUBLIC_CACHE_HEADERS });
  } catch (e) {
    console.error('Failed to fetch show by id:', e);
    return NextResponse.json({ error: 'Failed to fetch show' }, { status: 500 });
  }
}
