import { notFound, redirect } from 'next/navigation';
import { requireAdminPage } from '@/lib/auth/page-guard';
import { getArrangementForEdit } from '@/lib/services/admin';
import { showEditorHref } from '@/lib/services/admin-dashboard';
import { AdminCrumbs } from '../AdminCrumbs';
import { StandalonePart } from '../StandalonePart';

export const dynamic = 'force-dynamic';

/** A standalone part's editor. A part that a show uses is edited in that show's editor instead. */
export default async function EditArrangementPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage('canEditArrangements', '/admin');
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const data = await getArrangementForEdit(Number(id));
  if (!data) notFound();
  if (data.showSlug) redirect(showEditorHref(data.showSlug));
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <AdminCrumbs current={data.arrangement.title} />
      <h1 className="text-4xl font-bold mb-6">{data.arrangement.title}</h1>
      <StandalonePart arrangement={data.arrangement} allTags={data.allTags} allPieces={data.allPieces} />
    </div>
  );
}
