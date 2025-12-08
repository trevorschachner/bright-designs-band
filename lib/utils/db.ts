import { NextResponse } from 'next/server';

export async function getDb() {
  try {
    const { db } = await import('@/lib/database');
    return db;
  } catch (e) {
    console.error('Database import failed', e);
    return null;
  }
}

export async function withDb(
  handler: (db: any) => Promise<NextResponse>
) {
  const db = await getDb();
  if (!db) {
    return NextResponse.json(
      { error: 'Database not configured' }, 
      { status: 500 }
    );
  }
  return handler(db);
}

