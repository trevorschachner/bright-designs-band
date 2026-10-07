import { NextRequest } from 'next/server';
import { db } from '@/lib/database';
import { files, fileTypeEnum } from '@/lib/database/schema';
import { fileStorage } from '@/lib/storage';
import { guard } from '@/lib/auth/guard';
import { and, eq } from 'drizzle-orm';
import { PrivateResponse, ErrorResponse } from '@/lib/utils/api-helpers';

type FileType = typeof fileTypeEnum.enumValues[number];

/**
 * GET only. Uploads are Server Actions (lib/actions/uploads.ts: signUpload →
 * PUT to Storage → completeUpload); the POST handler and /api/files/sign were
 * removed in SP3 Task 4.
 */
export async function GET(request: NextRequest) {
  try {
    let createClient: any;
    try {
      ({ createClient } = await import('@/lib/utils/supabase/server'));
    } catch (e) {
      console.error('Supabase client import failed.', e);
      return ErrorResponse('Auth provider not configured');
    }
    const supabase = await createClient();
    // Optional gate: a denial here means "public rows only", not an error.
    const gate = await guard('canUploadFiles');
    const isStaff = gate.denied === null;

    const { searchParams } = new URL(request.url);
    const showId = searchParams.get('showId');
    const arrangementId = searchParams.get('arrangementId');
    const fileType = searchParams.get('fileType');

    let conditions = [];
    if (showId) conditions.push(eq(files.showId, parseInt(showId)));
    if (arrangementId) conditions.push(eq(files.arrangementId, parseInt(arrangementId)));
    if (fileType && fileTypeEnum.enumValues.includes(fileType as FileType)) {
      conditions.push(eq(files.fileType, fileType as FileType));
    }

    // Public files are always visible. Private files are only visible to staff.
    if (!isStaff) {
      conditions.push(eq(files.isPublic, true));
    }

    const fileList = await db.select().from(files).where(and(...conditions));

    const withUrls = fileList.map((f: any) => ({
      ...f,
      url: fileStorage.getFileUrl(f),
    }));

    // The rows depend on the caller, so this must never enter a shared cache.
    return PrivateResponse(withUrls);

  } catch (error) {
    console.error('File fetch error:', error);
    return ErrorResponse('Internal server error');
  }
}
