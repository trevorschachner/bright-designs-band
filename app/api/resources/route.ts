import { NextRequest, NextResponse } from 'next/server';
import { guard } from '@/lib/auth/guard';
import { resources, files } from '@/lib/database/schema';
import { desc, eq } from 'drizzle-orm';
import { SuccessResponse, PrivateResponse, ErrorResponse } from '@/lib/utils/api-helpers';

export async function GET(request: NextRequest) {
  try {
    // Lazy import DB
    let db: any;
    try {
      ({ db } = await import('@/lib/database'));
    } catch (e) {
      return ErrorResponse('Database not configured', 500);
    }

    // Inactive resources are drafts. Only staff who manage resources may ask
    // for them, and only explicitly with ?all=true.
    const wantsAll = new URL(request.url).searchParams.get('all') === 'true';
    if (wantsAll) {
      const gate = await guard('canManageResources');
      if (!gate.denied) {
        const data = await db.select().from(resources).orderBy(desc(resources.createdAt));
        return PrivateResponse(data);
      }
    }

    const data = await db
      .select()
      .from(resources)
      .where(eq(resources.isActive, true))
      .orderBy(desc(resources.createdAt));

    return SuccessResponse(data);
  } catch (error) {
    console.error('Error fetching resources:', error);
    return ErrorResponse('Failed to fetch resources', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const gate = await guard('canManageResources');
    if (gate.denied) return gate.denied;

    const body = await request.json();
    
    let db: any;
    try {
      ({ db } = await import('@/lib/database'));
    } catch (e) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Generate slug if not provided
    let slug = body.slug;
    if (!slug && body.title) {
      slug = body.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }

    if (!slug) {
      return NextResponse.json({ error: 'Title or slug is required' }, { status: 400 });
    }

    // Ensure unique slug
    const existing = await db.select().from(resources).where(eq(resources.slug, slug));
    if (existing.length > 0) {
      slug = `${slug}-${Date.now()}`;
    }

    const [newResource] = await db.insert(resources).values({
      title: body.title,
      slug,
      description: body.description,
      fileUrl: body.fileUrl,
      imageUrl: body.imageUrl,
      isActive: body.isActive ?? true,
      requiresContactForm: body.requiresContactForm ?? true,
    }).returning();

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

    return NextResponse.json(newResource);
  } catch (error: any) {
    console.error('Error creating resource:', error);
    return NextResponse.json({ error: 'Failed to create resource' }, { status: 500 });
  }
}

