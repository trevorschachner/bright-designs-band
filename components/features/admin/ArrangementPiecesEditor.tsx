'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp, Loader2, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { setArrangementPieces } from '@/lib/actions/arrangements';
import { createPiece } from '@/lib/actions/pieces';
import type { ActionResult } from '@/lib/actions/result';
import { canCreatePiece, moveItem, suggestPieces, type PieceSummary } from '@/lib/pieces/editor';

/**
 * Add, remove and reorder the source pieces an arrangement (show part) is
 * built from (#51). Each change saves immediately (`setArrangementPieces`),
 * the same way the Files panel beside it does, so there is no separate Save
 * step to forget. The linked list and the catalogue come from the server
 * page (getShowForEdit).
 */

type LinkedPiece = PieceSummary & { orderIndex: number };

function failure(result: Extract<ActionResult<unknown>, { ok: false }>): string {
  if (result.issues?.length) return result.issues.map((issue) => issue.message).join('; ');
  if (result.error === 'forbidden') return 'You do not have permission to edit pieces.';
  if (result.error === 'not_found') return 'This part was deleted. Reload the page.';
  return 'Could not save the pieces. Try again.';
}

export function ArrangementPiecesEditor({
  arrangementId,
  initialPieces,
  allPieces: catalogue,
}: {
  arrangementId: number;
  initialPieces: LinkedPiece[];
  allPieces: PieceSummary[];
}) {
  const [linked, setLinked] = useState<LinkedPiece[]>(initialPieces);
  const [allPieces, setAllPieces] = useState<PieceSummary[]>(catalogue);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [newComposer, setNewComposer] = useState('');

  const save = async (next: PieceSummary[]) => {
    const previous = linked;
    setLinked(next.map((p, i) => ({ ...p, orderIndex: i + 1 })));
    setSaving(true);
    setError(null);
    try {
      const result = await setArrangementPieces({ arrangementId, pieceIds: next.map(p => p.id) });
      if (result.ok) {
        setLinked(result.data);
      } else {
        setLinked(previous);
        setError(failure(result));
      }
    } catch {
      setLinked(previous);
      setError('Could not save the pieces. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const addExisting = async (piece: PieceSummary) => {
    setQuery('');
    setNewComposer('');
    await save([...linked, piece]);
  };

  const createAndAdd = async () => {
    const title = query.trim();
    if (!title) return;
    setSaving(true);
    setError(null);
    try {
      const result = await createPiece({ title, composer: newComposer });
      if (!result.ok) {
        setError(failure(result));
        setSaving(false);
        return;
      }
      const created: PieceSummary = { id: result.data.id, title: result.data.title, composer: result.data.composer };
      setAllPieces(prev => [...prev, created]);
      setQuery('');
      setNewComposer('');
      await save([...linked, created]);
    } catch {
      setError('Could not create the piece. Try again.');
      setSaving(false);
    }
  };

  const suggestions = suggestPieces(allPieces, linked.map(p => p.id), query);
  const offerCreate = canCreatePiece(allPieces, query);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h4 className="text-xs font-semibold text-muted-foreground tracking-wide">Source pieces</h4>
        {saving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
      </div>

      {error && (
        <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
          {error}
        </div>
      )}

      {linked.length === 0 ? (
        <p className="text-xs text-muted-foreground">No source pieces linked yet.</p>
      ) : (
        <ol className="divide-y rounded border border-border bg-background">
          {linked.map((piece, index) => (
            <li key={piece.id} className="flex items-center gap-2 px-3 py-2 text-sm">
              <span className="w-5 text-xs text-muted-foreground">{index + 1}.</span>
              <span className="min-w-0 flex-1 truncate">
                <span className="font-medium">{piece.title}</span>
                {piece.composer && <span className="text-muted-foreground"> · {piece.composer}</span>}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={`Move ${piece.title} up`}
                disabled={saving || index === 0}
                onClick={() => save(moveItem(linked, index, -1))}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={`Move ${piece.title} down`}
                disabled={saving || index === linked.length - 1}
                onClick={() => save(moveItem(linked, index, 1))}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={`Remove ${piece.title}`}
                disabled={saving}
                onClick={() => save(linked.filter(p => p.id !== piece.id))}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ol>
      )}

      <div className="space-y-2">
        <Input
          type="text"
          placeholder="Add a piece: search by title or composer"
          value={query}
          onChange={e => setQuery(e.target.value)}
          disabled={saving}
          aria-label="Search pieces to add"
        />
        {query.trim() && (
          <div className="rounded border border-border bg-background">
            <>
                {suggestions.map(piece => (
                  <button
                    key={piece.id}
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-muted disabled:opacity-50"
                    disabled={saving}
                    onClick={() => addExisting(piece)}
                  >
                    <span className="font-medium">{piece.title}</span>
                    {piece.composer && <span className="text-muted-foreground"> · {piece.composer}</span>}
                  </button>
                ))}
                {offerCreate && (
                  <div className="flex flex-wrap items-center gap-2 border-t px-3 py-2">
                    <span className="text-xs text-muted-foreground">
                      New piece &ldquo;{query.trim()}&rdquo;
                    </span>
                    <Input
                      type="text"
                      placeholder="Composer (optional)"
                      value={newComposer}
                      onChange={e => setNewComposer(e.target.value)}
                      disabled={saving}
                      className="h-8 max-w-[14rem]"
                      aria-label="Composer for the new piece"
                    />
                    <Button type="button" size="sm" disabled={saving} onClick={createAndAdd}>
                      <Plus className="mr-1 h-4 w-4" />
                      Create and add
                    </Button>
                  </div>
                )}
                {suggestions.length === 0 && !offerCreate && (
                  <p className="px-3 py-2 text-xs text-muted-foreground">Already on this part.</p>
                )}
            </>
          </div>
        )}
      </div>
    </div>
  );
}
