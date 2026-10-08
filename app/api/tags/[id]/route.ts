import { tags } from '@/lib/database/schema';
import { NextResponse } from 'next/server';
import { getTag } from '@/lib/services/tags';
import { reportError } from '@/lib/observability/report-error';

/** Generic body only: the underlying message never reaches the client. */
async function failed(error: unknown, operation: string) {
  await reportError(error, { operation });
  return NextResponse.json({ error: 'Failed to save tag' }, { status: 500 });
}

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
