import { redirect } from 'next/navigation';
import { guard } from '@/lib/auth/guard';
import { listPieces } from '@/lib/actions/pieces';
import { PiecesManager } from './PiecesManager';

export const dynamic = 'force-dynamic';

/** Source pieces admin (#51). The read is the guarded `listPieces` action. */
export default async function ManagePiecesPage() {
  const gate = await guard('canEditArrangements');
  if (gate.denied) redirect('/');

  const result = await listPieces();
  return result.ok ? (
    <PiecesManager pieces={result.data} />
  ) : (
    <PiecesManager pieces={[]} loadError="Could not load the pieces. Reload to try again." />
  );
}
