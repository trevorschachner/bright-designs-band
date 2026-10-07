import { NextResponse } from 'next/server';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}

export function SuccessResponse<T>(data: T, status: number = 200, cacheMaxAge: number = 3600): NextResponse<ApiResponse<T>> {
  const headers: Record<string, string> = {};
  
  // Only add cache headers for GET requests (status 200) or when explicitly requested
  // POST/PUT/DELETE responses (201, 204, etc.) should not be cached
  if (status === 200 && cacheMaxAge > 0) {
    headers['Cache-Control'] = `public, s-maxage=${cacheMaxAge}, stale-while-revalidate=${cacheMaxAge * 2}`;
    // Netlify keys its edge cache on the path plus whatever Netlify-Vary names.
    // The Next adapter emits `query=__nextDataReq|_rsc`, so without this every
    // query string on a path collapsed into one entry: /api/shows?search=apex
    // and ?search=times shared a body, and whichever request arrived first
    // served every visitor for an hour. `query` with no list varies on the
    // whole query string, which is what a filtered endpoint needs.
    headers['Netlify-Vary'] = 'query';
  }
  
  return NextResponse.json(
    { success: true, data },
    {
      status,
      ...(Object.keys(headers).length > 0 && { headers }),
    }
  );
}

/**
 * Same envelope as SuccessResponse, for bodies that depend on who is asking.
 * SuccessResponse is cached publicly and varies only on the query string, so a
 * session-dependent body sent through it can be served to the wrong visitor.
 */
export function PrivateResponse<T>(data: T, status: number = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    { success: true, data },
    { status, headers: { 'Cache-Control': 'private, no-store' } }
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
