import { NextRequest, NextResponse } from 'next/server';
import { resources, files } from '@/lib/database/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Lazy import DB
    let db: any;
    try {
      ({ db } = await import('@/lib/database'));
    } catch (e) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    let query = db.select().from(resources).orderBy(desc(resources.createdAt));

    if (activeOnly) {
      query = query.where(eq(resources.isActive, true));
    }

    const data = await query;

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error fetching resources:', error);
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    let createClient: any;
    try {
      ({ createClient } = await import('@/lib/utils/supabase/server'));
    } catch (e) {
      return NextResponse.json({ error: 'Auth provider not configured' }, { status: 500 });
    }
    
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is staff
    const userEmail = user?.email;
    if (!userEmail?.endsWith('@brightdesigns.band')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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

