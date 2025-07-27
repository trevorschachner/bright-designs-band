import { db } from '@/lib/db';
import { arrangements } from '@/lib/db/schema';
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const allArrangements = await db.query.arrangements.findMany();
  return NextResponse.json(allArrangements);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const newArrangement = await db.insert(arrangements).values(body).returning();
  return NextResponse.json(newArrangement);
} 