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

    // Get file details via Supabase (respect RLS/admin policies)
    const { data: fileRow, error: fetchErr } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single()
    if (fetchErr || !fileRow) {
      console.error('Supabase fetch error (files):', fetchErr?.message)
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
    const file = fileRow as any

    // Delete from Supabase Storage
    const storageResult = await fileStorage.deleteFile(file.storagePath)
    if (!storageResult.success) {
      console.error('Failed to delete from storage:', storageResult.error)
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database via Supabase (RLS-aware)
    const { error: delErr } = await supabase.from('files').delete().eq('id', fileId)
    if (delErr) {
      console.error('Supabase delete error (files):', delErr.message)
      return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
    }

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