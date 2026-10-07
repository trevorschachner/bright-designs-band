import { redirect } from 'next/navigation';
import { guard } from '@/lib/auth/guard';
import { getTagsForAdmin } from '@/lib/services/tags';
import { TagsManager } from './TagsManager';

export const dynamic = 'force-dynamic';

/** Tags admin. Uncached read; the manager re-reads (router.refresh) after each write. */
export default async function ManageTagsPage() {
  const gate = await guard('canManageTags');
  if (gate.denied) redirect('/');

  return <TagsManager tags={await getTagsForAdmin()} />;
}
