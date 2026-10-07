import { NextRequest, NextResponse } from 'next/server'
import { files } from '@/lib/database/schema'
import { eq } from 'drizzle-orm'
import { fileStorage } from '@/lib/storage'
import { guard } from '@/lib/auth/guard'

const noStore = { 'Cache-Control': 'private, no-store' }

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const fileId = parseInt(id, 10)

    if (isNaN(fileId)) {
      return NextResponse.json({ error: 'Invalid file ID' }, { status: 400 })
    }

    const { db } = await import('@/lib/database')

    // Drizzle returns camelCase fields (storagePath, isPublic); supabase-js
    // returns the raw snake_case columns, which broke the computed URL.
    const f = await db.query.files.findFirst({ where: eq(files.id, fileId) })

    // Private files are staff-only. Answer 404 rather than 401/403 so an
    // anonymous caller cannot tell a private file from a missing one.
    const gate = f && !f.isPublic ? await guard('canUploadFiles') : null
    if (!f || (gate && gate.denied)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404, headers: noStore })
    }

    const computedUrl = fileStorage.getFileUrl(f)

    return NextResponse.json({ success: true, file: { ...f, url: computedUrl } }, { headers: noStore })

  } catch (error) {
    console.error('File fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
