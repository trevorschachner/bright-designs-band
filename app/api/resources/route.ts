import { NextRequest } from 'next/server';
import { guard } from '@/lib/auth/guard';
import { resources } from '@/lib/database/schema';
import { SuccessResponse, PrivateResponse, ErrorResponse } from '@/lib/utils/api-helpers';
import { getActiveResources, getResourcesForAdmin } from '@/lib/services/resources';
import { readAdminSearch } from '@/lib/filters/admin-search';

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
      // `q` (the admin table's title search) applies to the staff read only.
      const data = gate.denied ? await getActiveResources() : await getResourcesForAdmin(readAdminSearch(searchParams));
      return PrivateResponse(data);
    }

    return SuccessResponse(await getActiveResources());
  } catch (error) {
    console.error('Error fetching resources:', error);
    return ErrorResponse('Failed to fetch resources', 500);
  }
}
