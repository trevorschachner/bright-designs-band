'use client';

import { ArrangementPiecesEditor } from '@/components/features/admin/ArrangementPiecesEditor';
import type { EditableArrangement } from '@/lib/services/admin';
import type { PieceSummary } from '@/lib/pieces/editor';

/**
 * The source pieces of one part (#51), on its card in the arrangements list.
 * Keyed by the server's list so a reload (router.refresh) re-seeds it.
 */
export function PiecesPanel({ arrangement, allPieces }: { arrangement: EditableArrangement; allPieces: PieceSummary[] }) {
  return (
    <div className="mt-3 pt-3 border-t">
      <ArrangementPiecesEditor
        key={arrangement.pieces.map((p) => p.id).join(',')}
        arrangementId={arrangement.id}
        initialPieces={arrangement.pieces}
        allPieces={allPieces}
      />
    </div>
  );
}
