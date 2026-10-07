import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { files } from '@/lib/database/schema'
import { guard } from '@/lib/auth/guard'
import { isValidYouTubeUrl } from '@/components/features/youtube-player'
import { invalidateFileOwner } from '@/lib/services/files'

export async function POST(request: NextRequest) {
  // canCreateArrangements, not canUploadFiles, is what this route has always
  // required. Preserved on purpose: changing which permission gates attaching a
  // YouTube file is a product decision, not part of this migration.
  const gate = await guard('canCreateArrangements')
  if (gate.denied) return gate.denied

  try {

    const body = await request.json()
    const { 
      url, 
      fileType, 
      isPublic = true, 
      description, 
      displayOrder = 0, 
      showId, 
      arrangementId 
    } = body

    if (!url) {
      return NextResponse.json({ error: 'YouTube URL is required' }, { status: 400 })
    }

    if (fileType !== 'youtube') {
      return NextResponse.json({ error: 'Invalid file type for YouTube endpoint' }, { status: 400 })
    }

    // Validate YouTube URL
    if (!isValidYouTubeUrl(url)) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
    }

    // Extract video ID and create a standardized filename
    const getYouTubeVideoId = (url: string): string | null => {
      const regexes = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
        /youtube\.com\/v\/([^&\n?#]+)/,
        /youtube\.com\/embed\/([^&\n?#]+)/,
        /youtu\.be\/([^&\n?#]+)/
      ]

      for (const regex of regexes) {
        const match = url.match(regex)
        if (match && match[1]) {
          return match[1]
        }
      }
      return null
    }

    const videoId = getYouTubeVideoId(url)
    if (!videoId) {
      return NextResponse.json({ error: 'Could not extract video ID from YouTube URL' }, { status: 400 })
    }

    // Create standardized filename and storage path
    const fileName = `youtube_${videoId}.url`
    const timestamp = Date.now()
    const storagePath = showId && arrangementId 
      ? `shows/${showId}/arrangements/${arrangementId}/youtube/${fileName}`
      : showId 
        ? `shows/${showId}/youtube/${fileName}`
        : arrangementId
          ? `arrangements/${arrangementId}/youtube/${fileName}`
          : `general/youtube/${fileName}`

    // Save YouTube link metadata to database
    const fileRecord = await db.insert(files).values({
      fileName,
      originalName: description || `YouTube Video ${videoId}`,
      fileType: 'youtube',
      fileSize: 0, // YouTube links don't have file size
      mimeType: 'text/url',
      url: url, // Store the original YouTube URL
      storagePath,
      showId: showId || null,
      arrangementId: arrangementId || null,
      isPublic,
      description,
      displayOrder,
    }).returning()

    await invalidateFileOwner(fileRecord[0])

    return NextResponse.json({ 
      success: true,
      file: fileRecord[0]
    })

  } catch (error) {
    console.error('YouTube URL submission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 