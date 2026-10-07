import { NextResponse } from 'next/server';
import { PUBLIC_CACHE_HEADERS } from '@/lib/utils/api-helpers';
import { getArrangementForApi } from '@/lib/services/arrangements';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const arrangementId = Number(id);
    if (!Number.isInteger(arrangementId) || arrangementId <= 0) {
      return NextResponse.json({ error: 'Arrangement not found' }, { status: 404 });
    }

    const arrangement = await getArrangementForApi(arrangementId);
    if (!arrangement) {
      return NextResponse.json({ error: 'Arrangement not found' }, { status: 404 });
    }

    return NextResponse.json(arrangement, { headers: PUBLIC_CACHE_HEADERS });
  } catch (error) {
    console.error('Error fetching arrangement:', error);
    return NextResponse.json({ error: 'Failed to fetch arrangement' }, { status: 500 });
  }
}
