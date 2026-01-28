import { NextResponse } from 'next/server';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}

export function SuccessResponse<T>(data: T, status: number = 200, cacheMaxAge: number = 3600): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    { success: true, data },
    {
      status,
      headers: {
        'Cache-Control': `public, s-maxage=${cacheMaxAge}, stale-while-revalidate=${cacheMaxAge * 2}`,
      },
    }
  );
}

export function ErrorResponse(
  error: string = 'Internal server error',
  status: number = 500,
  details?: unknown
): NextResponse<ApiResponse<null>> {
  return NextResponse.json({ success: false, error, details }, { status });
}

export function UnauthorizedResponse(): NextResponse<ApiResponse<null>> {
  return ErrorResponse('Unauthorized', 401);
}

export function ForbiddenResponse(): NextResponse<ApiResponse<null>> {
  return ErrorResponse('Forbidden', 403);
}

export function NotFoundResponse(resource: string = 'Resource'): NextResponse<ApiResponse<null>> {
  return ErrorResponse(`${resource} not found`, 404);
}

export function BadRequestResponse(details?: unknown): NextResponse<ApiResponse<null>> {
  return ErrorResponse('Bad request', 400, details);
}
