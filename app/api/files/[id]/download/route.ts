import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { guard } from '@/lib/auth/guard'
import { db } from '@/lib/database'
import { files } from '@/lib/database/schema'
import { storageBucketFor, withRootPrefix } from '@/lib/storage'

const noStore = { 'Cache-Control': 'private, no-store' }

/** Seconds a download link stays valid. */
const SIGNED_URL_TTL = 60

/**
 * GET /api/files/<id>/download: staff-only. 302 to a 60 s signed URL for the
 * row's object. This is the `url` of every private-bucket row (lib/storage.ts),
 * so a private file is never reachable without a staff session. Works for a
 * not-yet-migrated private row (still in the public bucket) too.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await guard('canUploadFiles')
  if (gate.denied) return gate.denied

  const { id } = await params
  const fileId = Number(id)
  if (!Number.isInteger(fileId) || fileId <= 0) {
    return NextResponse.json({ error: 'Invalid file ID' }, { status: 400, headers: noStore })
  }

  try {
    const [file] = await db
      .select({ storagePath: files.storagePath, url: files.url, fileType: files.fileType })
      .from(files)
      .where(eq(files.id, fileId))
      .limit(1)
    if (!file || file.fileType === 'youtube') {
      return NextResponse.json({ error: 'File not found' }, { status: 404, headers: noStore })
    }

    const { createClient } = await import('@/lib/utils/supabase/server')
    const supabase = await createClient()
    const { data, error } = await supabase.storage
      .from(storageBucketFor(file))
      .createSignedUrl(withRootPrefix(file.storagePath), SIGNED_URL_TTL)
    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: 'File not found' }, { status: 404, headers: noStore })
    }

    return NextResponse.redirect(data.signedUrl, { status: 302, headers: noStore })
  } catch (error) {
    console.error('File download error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: noStore })
  }
}
