import { NextResponse } from 'next/server';
import { getTag } from '@/lib/services/tags';
import { reportError } from '@/lib/observability/report-error';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const tag = /^\d+$/.test(id) ? await getTag(Number(id)) : null;
    if (!tag) return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    return NextResponse.json(tag);
  } catch (error) {
    await reportError(error, { operation: 'GET /api/tags/[id]' });
    return NextResponse.json({ error: 'Failed to fetch tag' }, { status: 500 });
  }
}
