import { NextRequest, NextResponse } from 'next/server';
import { fileStorage } from '@/lib/storage';
import { requirePermission } from '@/lib/auth/roles';
import { SuccessResponse, ErrorResponse, UnauthorizedResponse, ForbiddenResponse, BadRequestResponse } from '@/lib/utils/api-helpers';
import { z } from 'zod';

const signUrlSchema = z.object({
  fileName: z.string(),
  fileType: z.enum(['image', 'audio', 'youtube', 'pdf', 'score', 'other']),
  showId: z.number().optional(),
  arrangementId: z.number().optional(),
  isPublic: z.boolean().optional(),
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

    const json = await request.json();
    const parsed = signUrlSchema.safeParse(json);

    if (!parsed.success) {
      return BadRequestResponse(parsed.error.errors);
    }

    const { fileName, ...options } = parsed.data;

    // Use server-side authenticated client to generate signed URL
    const result = await fileStorage.createSignedUploadUrl(fileName, options, supabase);

    if (!result.success) {
      return ErrorResponse(result.error);
    }

    return SuccessResponse(result.data);

  } catch (error) {
    console.error('Signed URL generation error:', error);
    return ErrorResponse('Internal server error');
  }
}

