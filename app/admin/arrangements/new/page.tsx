import { requireAdminPage } from '@/lib/auth/page-guard';
import { getPartPickers } from '@/lib/services/admin';
import { AdminCrumbs } from '../AdminCrumbs';
import { StandalonePart } from '../StandalonePart';

export const dynamic = 'force-dynamic';

/** A new part that belongs to no show (e.g. a single arrangement for sale on its own). */
export default async function NewArrangementPage() {
  await requireAdminPage('canCreateArrangements', '/admin');
  const { allTags, allPieces } = await getPartPickers();
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <AdminCrumbs current="New part" />
      <h1 className="text-4xl font-bold mb-6">New standalone part</h1>
      <StandalonePart allTags={allTags} allPieces={allPieces} />
    </div>
  );
}
