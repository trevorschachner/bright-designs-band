import { db } from '@/lib/db';
import { tags } from '@/lib/db/schema';
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const allTags = await db.query.tags.findMany();
  return NextResponse.json(allTags);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const newTag = await db.insert(tags).values(body).returning();
  return NextResponse.json(newTag);
} 