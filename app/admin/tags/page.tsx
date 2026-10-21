import { requireAdminPage } from '@/lib/auth/page-guard';
import { getTagsForAdmin } from '@/lib/services/tags';
import { TagsManager } from './TagsManager';

export const dynamic = 'force-dynamic';

/** Tags admin. Uncached read; the manager re-reads (router.refresh) after each write. */
export default async function ManageTagsPage() {
  await requireAdminPage('canManageTags');

  return <TagsManager tags={await getTagsForAdmin()} />;
}
