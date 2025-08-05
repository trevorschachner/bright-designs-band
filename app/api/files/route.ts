import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/utils/supabase/server'
import { db } from '@/lib/database'
import { files } from '@/lib/database/schema'
import { fileStorage } from '@/lib/storage'
import { getUserRole, getUserPermissions } from '@/lib/auth/roles'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userPermissions = getUserPermissions(session.user.email || '')
    if (!userPermissions.canCreateArrangements) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const showId = formData.get('showId') ? parseInt(formData.get('showId') as string) : undefined
    const arrangementId = formData.get('arrangementId') ? parseInt(formData.get('arrangementId') as string) : undefined
    const fileType = formData.get('fileType') as 'image' | 'audio' | 'video' | 'pdf' | 'score' | 'other'
    const isPublic = formData.get('isPublic') === 'true'
    const description = formData.get('description') as string || undefined
    const displayOrder = formData.get('displayOrder') ? parseInt(formData.get('displayOrder') as string) : 0

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!fileType) {
      return NextResponse.json({ error: 'File type is required' }, { status: 400 })
    }

    // Upload file to Supabase Storage
    const uploadResult = await fileStorage.uploadFile(file, {
      showId,
      arrangementId,
      fileType,
      isPublic,
      description,
      displayOrder
    })

    if (!uploadResult.success) {
      return NextResponse.json({ error: uploadResult.error }, { status: 400 })
    }

    // Save file metadata to database
    const fileRecord = await db.insert(files).values({
      fileName: uploadResult.data!.fileName,
      originalName: file.name,
      fileType,
      fileSize: uploadResult.data!.fileSize,
      mimeType: uploadResult.data!.mimeType,
      url: uploadResult.data!.url,
      storagePath: uploadResult.data!.storagePath,
      showId,
      arrangementId,
      isPublic,
      description,
      displayOrder,
    }).returning()

    return NextResponse.json({ 
      success: true,
      file: fileRecord[0]
    })

  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const showId = searchParams.get('showId')
    const arrangementId = searchParams.get('arrangementId')
    const fileType = searchParams.get('fileType')

    const query = db.select().from(files)

    // Apply filters
    const conditions: any[] = []
    
    if (showId) {
      conditions.push(`show_id = ${parseInt(showId)}`)
    }
    
    if (arrangementId) {
      conditions.push(`arrangement_id = ${parseInt(arrangementId)}`)
    }
    
    if (fileType) {
      conditions.push(`file_type = '${fileType}'`)
    }

    // For now, return all files (you might want to add authentication for private files)
    const fileList = await db.select().from(files)

    return NextResponse.json({
      success: true,
      files: fileList
    })

  } catch (error) {
    console.error('File fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 