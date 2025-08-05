import { db } from '@/lib/database';
import { tags } from '@/lib/database/schema';
import { createClient } from '@/lib/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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