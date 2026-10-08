import { notFound, redirect } from 'next/navigation';
import { guard } from '@/lib/auth/guard';
import { getResourceForAdmin } from '@/lib/services/resources';
import { ResourceEditor } from './ResourceEditor';

export const dynamic = 'force-dynamic';

/** Resource editor: uncached read by id or slug (drafts included). */
export default async function EditResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const gate = await guard('canManageResources');
  if (gate.denied) redirect('/');

  const { id } = await params;
  const resource = await getResourceForAdmin(decodeURIComponent(id));
  if (!resource) notFound();
  return <ResourceEditor resource={resource} />;
}
