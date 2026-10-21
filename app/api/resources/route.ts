import { NextRequest } from 'next/server';
import { guard } from '@/lib/auth/guard';
import { SuccessResponse, PrivateResponse, ErrorResponse } from '@/lib/utils/api-helpers';
import { getActiveResources, getResourcesPageForAdmin } from '@/lib/services/resources';
import { toListResponse } from '@/lib/services/catalog';
import { readAdminPage, readAdminSearch } from '@/lib/filters/admin-search';

export async function GET(request: NextRequest) {
  try {
    // Inactive resources are drafts. Only staff who manage resources may ask
    // for them, and only explicitly with ?all=true.
    const { searchParams } = new URL(request.url);
    const wantsAll = searchParams.get('all') === 'true';
    if (wantsAll) {
      // Never answer ?all=true from the shared public cache: the cache key is
      // the query string only, so staff could be served the active-only list.
      const gate = await guard('canManageResources');
      if (gate.denied) return PrivateResponse(await getActiveResources());
      // Staff get one page in the catalog list shape, so the admin table can
      // page past the first 20. `q` (title search) applies to this read only.
      const { page, limit } = readAdminPage(searchParams);
      const result = await getResourcesPageForAdmin({ q: readAdminSearch(searchParams), page, limit });
      return PrivateResponse(toListResponse(result, { page, limit, conditions: [], sort: [] }));
    }

    return SuccessResponse(await getActiveResources());
  } catch (error) {
    console.error('Error fetching resources:', error);
    return ErrorResponse('Failed to fetch resources', 500);
  }
}
