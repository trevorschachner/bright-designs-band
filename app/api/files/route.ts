import { NextRequest, NextResponse } from 'next/server';
import { files, fileTypeEnum } from '@/lib/database/schema';
import { fileStorage, withRootPrefix, STORAGE_BUCKET } from '@/lib/storage';
import { requirePermission } from '@/lib/auth/roles';
import { and, eq } from 'drizzle-orm';
import { SuccessResponse, ErrorResponse, UnauthorizedResponse, ForbiddenResponse, BadRequestResponse } from '@/lib/utils/api-helpers';
import { fileUploadSchema } from '@/lib/validation/files';
import { z } from 'zod';

type FileType = typeof fileTypeEnum.enumValues[number];

// Schema for recording a file after direct client-side upload
const fileRecordSchema = z.object({
  storagePath: z.string(),
  fileName: z.string(),
  fileType: z.enum(['image', 'audio', 'youtube', 'pdf', 'score', 'other']),
  fileSize: z.number().nonnegative(),
  mimeType: z.string(),
  showId: z.number().optional(),
  arrangementId: z.number().optional(),
  isPublic: z.boolean().optional(),
  description: z.string().optional(),
  displayOrder: z.number().optional(),
});

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
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return UnauthorizedResponse();
    }

    if (!requirePermission(user.email, 'canUploadFiles')) {
      return ForbiddenResponse();
    }

    // Determine request type: JSON (Record Mode) or Multipart (Legacy/Server Upload)
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      // --- RECORD MODE (Direct Upload) ---
      const json = await request.json();
      const parsed = fileRecordSchema.safeParse(json);
      
      if (!parsed.success) {
        return BadRequestResponse(parsed.error.errors);
      }
      
      const metadata = parsed.data;
      
      // Get public URL from storage path
      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(withRootPrefix(metadata.storagePath));
        
      const insertPayload: any = {
        file_name: metadata.fileName,
        original_name: metadata.fileName, // Or pass separately if needed
        file_type: metadata.fileType,
        file_size: metadata.fileSize,
        mime_type: metadata.mimeType,
        url: publicUrl,
        storage_path: metadata.storagePath,
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
        return ErrorResponse(`Failed to persist file record: ${insertErr.message}`);
      }
      
      // Update show graphicUrl if applicable
      if (metadata.fileType === 'image' && metadata.showId && !metadata.arrangementId && inserted?.url) {
        await supabase
          .from('shows')
          .update({ graphic_url: inserted.url })
          .eq('id', metadata.showId);
      }
      
      return SuccessResponse(inserted, 201);

    } else {
      // --- UPLOAD MODE (Server-side Upload) ---
      const formData = await request.formData();
      const rawData = Object.fromEntries(formData.entries());
      
      // Parse numbers/booleans from formData strings
      // ...existing logic...
      
      // Quick fix: convert formData entries to primitives for schema
      // fileUploadSchema expects numbers for IDs, but formData provides strings.
      // The schema preprocessing handles this, but let's be safe.
      
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
  
      // Write via Supabase
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
        return ErrorResponse(`Failed to persist file record: ${insertErr.message}`);
      }
  
      if (metadata.fileType === 'image' && metadata.showId && !metadata.arrangementId && inserted?.url) {
        await supabase
          .from('shows')
          .update({ graphic_url: inserted.url })
          .eq('id', metadata.showId);
      }
  
      return SuccessResponse(inserted, 201);
    }

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
