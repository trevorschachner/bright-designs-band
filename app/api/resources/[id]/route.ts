import { NextRequest, NextResponse } from 'next/server';
import { guard } from '@/lib/auth/guard';
import { resources, files } from '@/lib/database/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    let db: any;
    try {
      ({ db } = await import('@/lib/database'));
    } catch (e) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const idNum = parseInt(id, 10);
    const isNumeric = !isNaN(idNum);

    const [resource] = await db
      .select()
      .from(resources)
      .where(isNumeric ? eq(resources.id, idNum) : eq(resources.slug, id));

    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    return NextResponse.json(resource);
  } catch (error: any) {
    console.error('Error fetching resource:', error);
    return NextResponse.json({ error: 'Failed to fetch resource' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const gate = await guard('canManageResources');
    if (gate.denied) return gate.denied;

    const body = await request.json();
    
    let db: any;
    try {
      ({ db } = await import('@/lib/database'));
    } catch (e) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const idNum = parseInt(id, 10);
    const isNumeric = !isNaN(idNum);
    
    const [updatedResource] = await db
      .update(resources)
      .set({
        title: body.title,
        slug: body.slug,
        description: body.description,
        fileUrl: body.fileUrl,
        imageUrl: body.imageUrl,
        isActive: body.isActive,
        requiresContactForm: body.requiresContactForm,
        updatedAt: new Date(),
      })
      .where(isNumeric ? eq(resources.id, idNum) : eq(resources.slug, id))
      .returning();

    if (!updatedResource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    // Sync description to file record if exists
    if (body.fileUrl && body.description) {
      try {
        await db.update(files)
          .set({ description: body.description })
          .where(eq(files.url, body.fileUrl));
      } catch (e) {
        console.warn('Failed to sync file description', e);
      }
    }

    return NextResponse.json(updatedResource);
  } catch (error: any) {
    console.error('Error updating resource:', error);
    return NextResponse.json({ error: 'Failed to update resource' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const gate = await guard('canManageResources');
    if (gate.denied) return gate.denied;

    let db: any;
    try {
      ({ db } = await import('@/lib/database'));
    } catch (e) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const idNum = parseInt(id, 10);
    const isNumeric = !isNaN(idNum);
    
    const [deletedResource] = await db
      .delete(resources)
      .where(isNumeric ? eq(resources.id, idNum) : eq(resources.slug, id))
      .returning();

    if (!deletedResource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    return NextResponse.json(deletedResource);
  } catch (error: any) {
    console.error('Error deleting resource:', error);
    return NextResponse.json({ error: 'Failed to delete resource' }, { status: 500 });
  }
}

