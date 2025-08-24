import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/utils/supabase/server';
import { db } from '@/lib/database';
import { files, fileTypeEnum } from '@/lib/database/schema';
import { fileStorage } from '@/lib/storage';
import { requirePermission } from '@/lib/auth/roles';
import { and, eq } from 'drizzle-orm';
import { SuccessResponse, ErrorResponse, UnauthorizedResponse, ForbiddenResponse, BadRequestResponse } from '@/lib/utils/api-helpers';
import { fileUploadSchema } from '@/lib/validation/files';

type FileType = typeof fileTypeEnum.enumValues[number];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return UnauthorizedResponse();
    }

    if (!requirePermission(session.user.email, 'canUploadFiles')) {
      return ForbiddenResponse();
    }

    const formData = await request.formData();
    const rawData = Object.fromEntries(formData.entries());
    
    const parsedData = fileUploadSchema.safeParse(rawData);

    if (!parsedData.success) {
      return BadRequestResponse(parsedData.error.errors);
    }
    
    const { file, ...metadata } = parsedData.data;

    const uploadResult = await fileStorage.uploadFile(file, metadata);

    if (!uploadResult.success) {
      return BadRequestResponse(uploadResult.error);
    }

    const fileRecord = await db.insert(files).values({
      ...metadata,
      fileName: uploadResult.data!.fileName,
      originalName: file.name,
      fileSize: uploadResult.data!.fileSize,
      mimeType: uploadResult.data!.mimeType,
      url: uploadResult.data!.url,
      storagePath: uploadResult.data!.storagePath,
    }).returning();

    return SuccessResponse(fileRecord[0], 201);

  } catch (error) {
    console.error('File upload error:', error);
    return ErrorResponse('Internal server error');
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

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

    // Public files are always visible. Private files are only visible to authenticated users.
    if (!session) {
      conditions.push(eq(files.isPublic, true));
    }

    const fileList = await db.select().from(files).where(and(...conditions));

    return SuccessResponse(fileList);

  } catch (error) {
    console.error('File fetch error:', error);
    return ErrorResponse('Internal server error');
  }
} 