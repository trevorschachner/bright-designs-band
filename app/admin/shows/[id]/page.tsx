import { notFound, redirect } from 'next/navigation';
import { guard } from '@/lib/auth/guard';
import { ShowEditor } from '@/components/features/admin/show-editor/ShowEditor';
import { getShowForEdit } from '@/lib/services/admin';

export const dynamic = 'force-dynamic';

const NOTICES: Record<string, string> = {
  failed: 'Show created, but the thumbnail upload failed. Upload it again with the button beside Thumbnail URL.',
};

/**
 * The show editor. One uncached read (show, parts with tags and pieces,
 * files, tag and piece pickers); every panel writes through Server Actions
 * and re-reads this page. `id` is a numeric id or a slug (the admin list
 * links by slug).
 */
export default async function EditShowPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ thumbnail?: string }>;
}) {
  const gate = await guard('canManageShows');
  if (gate.denied) redirect('/');

  const [{ id }, { thumbnail }] = await Promise.all([params, searchParams]);
  const initial = await getShowForEdit(decodeURIComponent(id));
  if (!initial) notFound();

  return <ShowEditor key={initial.show.id} mode="edit" initial={initial} notice={thumbnail ? NOTICES[thumbnail] : undefined} />;
}
