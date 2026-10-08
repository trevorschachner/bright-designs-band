import { NextResponse } from 'next/server';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
}

/** Edge cache lifetime for public API responses, in seconds. */
export const PUBLIC_CACHE_MAX_AGE = 60;

/**
 * Headers for a public, edge-cacheable response. Browsers always revalidate
 * (`max-age=0`); the CDN keeps it for `sMaxAge` seconds and may serve it stale
 * for five minutes while it refetches. The data behind it is cached in Next's
 * data cache and invalidated on every write (lib/services/invalidate.ts), so a
 * short edge lifetime bounds how long a write can stay invisible there.
 */
export function publicCacheHeaders(sMaxAge: number = PUBLIC_CACHE_MAX_AGE): Record<string, string> {
  return {
    'Cache-Control': `public, max-age=0, s-maxage=${sMaxAge}, stale-while-revalidate=300`,
    // Netlify keys its edge cache on the path plus whatever Netlify-Vary names.
    // The Next adapter emits `query=__nextDataReq|_rsc`, so without this every
    // query string on a path collapsed into one entry: /api/shows?search=apex
    // and ?search=times shared a body, and whichever request arrived first
    // served every visitor for an hour. `query` with no list varies on the
    // whole query string, which is what a filtered endpoint needs.
    'Netlify-Vary': 'query',
  };
}

export const PUBLIC_CACHE_HEADERS = publicCacheHeaders();

/** For bodies that depend on who is asking. Never stored by any cache. */
export const PRIVATE_HEADERS = { 'Cache-Control': 'private, no-store' };

export function SuccessResponse<T>(
  data: T,
  status: number = 200,
  cacheMaxAge: number = PUBLIC_CACHE_MAX_AGE
): NextResponse<ApiResponse<T>> {
  // Only 200s are cached; POST/PUT/DELETE responses (201, 204, ...) are not.
  // Pass cacheMaxAge 0 for a 200 that must not be cached.
  const headers: Record<string, string> =
    status === 200 && cacheMaxAge > 0 ? publicCacheHeaders(cacheMaxAge) : {};
  
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
    { status, headers: PRIVATE_HEADERS }
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
