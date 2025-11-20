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
    // Use getUser() instead of getSession() for proper authentication
    // This ensures the user is authenticated and RLS policies can access auth.email()
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return UnauthorizedResponse();
    }

    // Verify user email for debugging
    console.log('Authenticated user:', { email: user.email, id: user.id });

    if (!requirePermission(user.email, 'canUploadFiles')) {
      console.error('User does not have upload permission:', user.email);
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
      fileSize:
        rawData.file && typeof rawData.file === 'object' && 'size' in (rawData.file as any)
          ? (rawData.file as any).size
          : 'unknown',
      mimeType:
        rawData.file && typeof rawData.file === 'object' && 'type' in (rawData.file as any)
          ? (rawData.file as any).type
          : 'unknown',
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
    // Verify authentication context before insert
    const { data: { user: verifyUser } } = await supabase.auth.getUser();
    console.log('Pre-insert auth check:', { 
      email: verifyUser?.email, 
      authenticated: !!verifyUser 
    });

    const { data: inserted, error: insertErr } = await supabase
      .from('files')
      .insert(insertPayload)
      .select('*')
      .single();
    
    if (insertErr) {
      console.error('Supabase insert error (files):', {
        message: insertErr.message,
        code: insertErr.code,
        details: insertErr.details,
        hint: insertErr.hint,
        userEmail: verifyUser?.email,
        insertPayload
      });
      return ErrorResponse(`Failed to persist file record: ${insertErr.message}`);
    }

    // If this is an image uploaded for a show (not an arrangement), update the show's graphicUrl
    if (metadata.fileType === 'image' && metadata.showId && !metadata.arrangementId && inserted?.url) {
      try {
        const { error: updateErr } = await supabase
          .from('shows')
          .update({ graphic_url: inserted.url })
          .eq('id', metadata.showId);
        
        if (updateErr) {
          console.warn('Failed to update show graphicUrl:', updateErr.message);
          // Don't fail the upload if this update fails
        } else {
          console.log('Updated show graphicUrl for show', metadata.showId);
        }
      } catch (updateError) {
        console.warn('Error updating show graphicUrl:', updateError);
        // Don't fail the upload if this update fails
      }
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
    // Use getUser() for proper authentication
    const { data: { user } } = await supabase.auth.getUser();

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
    if (!user) {
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