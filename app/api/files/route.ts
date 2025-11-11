import { NextRequest, NextResponse } from 'next/server';
import { files, fileTypeEnum } from '@/lib/database/schema';
import { fileStorage } from '@/lib/storage';
import { requirePermission } from '@/lib/auth/roles';
import { and, eq } from 'drizzle-orm';
import { SuccessResponse, ErrorResponse, UnauthorizedResponse, ForbiddenResponse, BadRequestResponse } from '@/lib/utils/api-helpers';
import { fileUploadSchema } from '@/lib/validation/files';

type FileType = typeof fileTypeEnum.enumValues[number];

export async function POST(request: NextRequest) {
  try {
    let createClient: any;
    try {
      ({ createClient } = await import('@/lib/utils/supabase/server'));
    } catch (e) {
      console.error('Supabase client import failed.', e);
      return ErrorResponse('Auth provider not configured');
    }
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
    
    console.log('File upload - raw form data:', {
      fileType: rawData.fileType,
      showId: rawData.showId,
      arrangementId: rawData.arrangementId,
      isPublic: rawData.isPublic,
      hasFile: !!rawData.file,
      fileSize: rawData.file instanceof File ? rawData.file.size : 'not a File',
      fileType: rawData.file instanceof File ? rawData.file.type : 'not a File',
    });
    
    const parsedData = fileUploadSchema.safeParse(rawData);

    if (!parsedData.success) {
      console.error('File upload validation failed:', parsedData.error.errors);
      return BadRequestResponse(parsedData.error.errors);
    }
    
    const { file, ...metadata } = parsedData.data;

    // Pass the authenticated server-side Supabase client to the storage service
    const uploadResult = await fileStorage.uploadFile(file, metadata, supabase);

    if (!uploadResult.success) {
      console.error('File upload failed:', uploadResult.error);
      return BadRequestResponse(uploadResult.error);
    }

    // Write via Supabase (respects RLS using the authenticated user)
    const insertPayload: any = {
      file_name: uploadResult.data!.fileName,
      original_name: file.name,
      file_type: metadata.fileType,
      file_size: uploadResult.data!.fileSize,
      mime_type: uploadResult.data!.mimeType,
      url: uploadResult.data!.url,
      storage_path: uploadResult.data!.storagePath,
      show_id: metadata.showId ?? null,
      arrangement_id: metadata.arrangementId ?? null,
      is_public: metadata.isPublic ?? true,
      description: metadata.description ?? null,
      display_order: typeof metadata.displayOrder === 'number' ? metadata.displayOrder : 0,
    };
    const { data: inserted, error: insertErr } = await supabase
      .from('files')
      .insert(insertPayload)
      .select('*')
      .single();
    if (insertErr) {
      console.error('Supabase insert error (files):', insertErr.message, { insertPayload });
      return ErrorResponse('Failed to persist file record');
    }

    return SuccessResponse(inserted, 201);

  } catch (error) {
    console.error('File upload error:', error);
    return ErrorResponse('Internal server error');
  }
}

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

    let db: any;
    try {
      ({ db } = await import('@/lib/database'));
    } catch (e) {
      console.error('Database import failed (likely no DATABASE_URL).', e);
      return ErrorResponse('Database not configured');
    }
    const fileList = await db.select().from(files).where(and(...conditions));

    const withUrls = fileList.map((f: any) => ({
      ...f,
      url: fileStorage.getFileUrl(f.storagePath, f.isPublic, supabase),
    }));

    return SuccessResponse(withUrls);

  } catch (error) {
    console.error('File fetch error:', error);
    return ErrorResponse('Internal server error');
  }
} 