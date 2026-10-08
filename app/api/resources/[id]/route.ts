import { NextRequest, NextResponse } from 'next/server';
import { guard } from '@/lib/auth/guard';
import { PrivateResponse } from '@/lib/utils/api-helpers';
import { getResource } from '@/lib/services/resources';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const resource = await getResource(id);

    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    // Inactive rows are drafts: staff only, never cached publicly.
    if (!resource.isActive) {
      const gate = await guard('canManageResources');
      if (gate.denied) {
        return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
      }
      return PrivateResponse(resource);
    }

    return NextResponse.json(resource);
  } catch (error: any) {
    console.error('Error fetching resource:', error);
    return NextResponse.json({ error: 'Failed to fetch resource' }, { status: 500 });
  }
}
