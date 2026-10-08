import { NextRequest, NextResponse } from 'next/server'
import { files } from '@/lib/database/schema'
import { eq } from 'drizzle-orm'
import { fileStorage } from '@/lib/storage'
import { guard } from '@/lib/auth/guard'
import { invalidateFileOwner } from '@/lib/services/files'

const noStore = { 'Cache-Control': 'private, no-store' }

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authorize before parsing anything: an unauthenticated caller should not be
  // able to tell a malformed id from a well-formed one.
  const gate = await guard('canDeleteFiles')
  if (gate.denied) return gate.denied

  try {
    const { id } = await params
    const fileId = parseInt(id, 10)

    if (isNaN(fileId)) {
      return NextResponse.json({ error: 'Invalid file ID' }, { status: 400 })
    }

    const { db } = await import('@/lib/database')
    const { shows } = await import('@/lib/database/schema')

    const file = await db.query.files.findFirst({ where: eq(files.id, fileId) })
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Delete from Supabase Storage
    const storageResult = await fileStorage.deleteFile(file.storagePath, await (await import('@/lib/utils/supabase/server')).createClient())
    if (!storageResult.success) {
      console.error('Failed to delete from storage:', storageResult.error)
      // Continue with database deletion even if storage deletion fails
    }

    if (file.showId && file.url) {
      const show = await db.query.shows.findFirst({
        where: eq(shows.id, file.showId),
        columns: { id: true, graphicUrl: true, thumbnailUrl: true },
      })
      if (show) {
        const updates: any = {}
        if (show.graphicUrl === file.url) updates.graphicUrl = null
        if (show.thumbnailUrl === file.url) updates.thumbnailUrl = null
        if (Object.keys(updates).length > 0) {
          await db.update(shows).set(updates).where(eq(shows.id, file.showId))
        }
      }
    }

    await db.delete(files).where(eq(files.id, fileId))
    await invalidateFileOwner(file)

    return NextResponse.json({ 
      success: true,
      message: 'File deleted successfully'
    })

  } catch (error) {
    console.error('File deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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

    const computedUrl = fileStorage.getFileUrl(f.storagePath, f.isPublic)

    return NextResponse.json({ success: true, file: { ...f, url: computedUrl } }, { headers: noStore })

  } catch (error) {
    console.error('File fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 