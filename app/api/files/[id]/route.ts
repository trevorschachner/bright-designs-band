import { NextRequest, NextResponse } from 'next/server'
import { files } from '@/lib/database/schema'
import { eq } from 'drizzle-orm'
import { fileStorage } from '@/lib/storage'
import { getUserPermissions } from '@/lib/auth/roles'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const fileId = parseInt(id, 10)

    if (isNaN(fileId)) {
      return NextResponse.json({ error: 'Invalid file ID' }, { status: 400 })
    }

    let createClient: any
    try {
      ({ createClient } = await import('@/lib/utils/supabase/server'))
    } catch (e) {
      console.error('Supabase client import failed.', e)
      return NextResponse.json({ error: 'Auth provider not configured' }, { status: 500 })
    }
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userPermissions = getUserPermissions(session.user.email || '')
    if (!userPermissions.canDeleteFiles) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { db } = await import('@/lib/database')
    const { shows } = await import('@/lib/database/schema')

    const file = await db.query.files.findFirst({ where: eq(files.id, fileId) })
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Delete from Supabase Storage
    const storageResult = await fileStorage.deleteFile(file.storagePath)
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

    let createClient: any
    try {
      ({ createClient } = await import('@/lib/utils/supabase/server'))
    } catch (e) {
      console.error('Supabase client import failed.', e)
      return NextResponse.json({ error: 'Auth provider not configured' }, { status: 500 })
    }
    const supabase = await createClient()

    // Fetch via Supabase to respect RLS
    const { data: fileRow, error: fetchErr } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single()
    if (fetchErr || !fileRow) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const f = fileRow as any
    const computedUrl = fileStorage.getFileUrl(f.storagePath, f.isPublic, supabase)

    return NextResponse.json({ success: true, file: { ...f, url: computedUrl } })

  } catch (error) {
    console.error('File fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 