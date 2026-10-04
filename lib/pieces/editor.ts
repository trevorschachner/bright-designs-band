/**
 * Pure list logic behind the admin "Source pieces" editor, kept out of the
 * component so it can be tested without rendering.
 */

export type PieceSummary = { id: number; title: string; composer: string | null };

/** Move the item at `index` by `delta` places. Out-of-range moves are no-ops. */
export function moveItem<T>(items: readonly T[], index: number, delta: number): T[] {
  const target = index + delta;
  if (index < 0 || index >= items.length || target < 0 || target >= items.length) {
    return [...items];
  }
  const next = [...items];
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return next;
}

const norm = (s: string | null | undefined) => (s ?? '').trim().toLowerCase();

/**
 * Pieces to offer for a search: not already on the part, matching the query on
 * title or composer, title matches first. An empty query offers nothing so the
 * list does not open with 243 rows.
 */
export function suggestPieces(
  all: readonly PieceSummary[],
  linkedIds: readonly number[],
  query: string,
  limit = 8
): PieceSummary[] {
  const q = norm(query);
  if (!q) return [];
  const linked = new Set(linkedIds);
  const candidates = all.filter(p => !linked.has(p.id));
  const byTitle = candidates.filter(p => norm(p.title).includes(q));
  const byComposer = candidates.filter(p => !norm(p.title).includes(q) && norm(p.composer).includes(q));
  return [...byTitle, ...byComposer].slice(0, limit);
}

/** True when no existing piece already has exactly this title (case- and space-insensitive). */
export function canCreatePiece(all: readonly PieceSummary[], query: string): boolean {
  const q = norm(query);
  return q.length > 0 && !all.some(p => norm(p.title) === q);
}
