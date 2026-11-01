'use client';

import { useRouter } from 'next/navigation';
import { ArrangementForm } from '@/components/features/admin/show-editor/ArrangementForm';
import { PiecesPanel } from '@/components/features/admin/show-editor/PiecesPanel';
import type { EditableArrangement } from '@/lib/services/admin';
import type { AdminTagRow } from '@/lib/services/tags';
import type { PieceSummary } from '@/lib/pieces/editor';

/**
 * A part that belongs to no show: its fields and, once saved, its source
 * pieces. A new part goes to its own page after the first save.
 */
export function StandalonePart({
  arrangement,
  allTags,
  allPieces,
}: {
  arrangement?: EditableArrangement;
  allTags: AdminTagRow[];
  allPieces: PieceSummary[];
}) {
  const router = useRouter();
  return (
    <div className="space-y-6">
      <ArrangementForm
        key={arrangement?.updatedAt ?? 'new'}
        arrangement={arrangement}
        allTags={allTags}
        onSaved={(saved) => (arrangement ? router.refresh() : router.push(`/admin/arrangements/${saved.id}`))}
        onCancel={() => router.push('/admin/arrangements')}
      />
      {arrangement && <PiecesPanel arrangement={arrangement} allPieces={allPieces} />}
    </div>
  );
}
