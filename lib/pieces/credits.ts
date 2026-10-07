/**
 * Public "Features music from…" credit for a part. Only title and composer are
 * public; copyright cost and licensing status stay internal.
 */

export type PublicPiece = { title: string; composer: string | null };

const norm = (s: string | null | undefined) => (s ?? '').trim().toLowerCase();

export function formatPiece(piece: PublicPiece): string {
  const composer = piece.composer?.trim();
  return composer ? `${piece.title} (${composer})` : piece.title;
}

/**
 * The pieces worth crediting under a part. Most single-song parts are linked to
 * a piece with the same title, so crediting it would just repeat the heading.
 * That piece is kept only when it adds a composer the part doesn't show.
 */
export function piecesToCredit(
  part: { title: string | null; composer: string | null },
  pieces: readonly PublicPiece[]
): PublicPiece[] {
  if (pieces.length === 1) {
    const [only] = pieces;
    const sameTitle = norm(only.title) === norm(part.title);
    const nothingNew = !norm(only.composer) || norm(only.composer) === norm(part.composer);
    if (sameTitle && nothingNew) return [];
  }
  return [...pieces];
}
