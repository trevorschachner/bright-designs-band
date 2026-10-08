'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Edit, Trash2, Plus, Loader2 } from 'lucide-react';
import { createPiece, deletePiece, updatePiece, type PieceRow } from '@/lib/actions/pieces';
import type { ActionResult } from '@/lib/actions/result';

/**
 * Source pieces (#51): the works a show part is built from, with composer and
 * copyright cost. Linking pieces to parts happens on each arrangement in the
 * show editor; this screen is for the catalogue itself.
 */

type Piece = PieceRow;

type PieceForm = { title: string; composer: string; copyrightAmountUsd: string; licensingStatus: string };

const EMPTY_FORM: PieceForm = { title: '', composer: '', copyrightAmountUsd: '', licensingStatus: '' };

const toForm = (p: Piece): PieceForm => ({
  title: p.title,
  composer: p.composer ?? '',
  copyrightAmountUsd: p.copyrightAmountUsd ?? '',
  licensingStatus: p.licensingStatus ?? '',
});

function messageFor(result: Extract<ActionResult<unknown>, { ok: false }>): string {
  if (result.issues?.length) return result.issues.map((issue) => issue.message).join('; ');
  if (result.error === 'not_found') return 'That piece was already deleted.';
  if (result.error === 'forbidden') return 'You do not have permission to edit pieces.';
  return 'Something went wrong. Try again.';
}

function PieceFields({
  idPrefix,
  form,
  onChange,
  disabled,
}: {
  idPrefix: string;
  form: PieceForm;
  onChange: (form: PieceForm) => void;
  disabled: boolean;
}) {
  return (
    <>
      <div>
        <Label htmlFor={`${idPrefix}-title`}>Title</Label>
        <Input
          id={`${idPrefix}-title`}
          value={form.title}
          onChange={e => onChange({ ...form, title: e.target.value })}
          placeholder="e.g. Libertango"
          disabled={disabled}
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-composer`}>Composer</Label>
        <Input
          id={`${idPrefix}-composer`}
          value={form.composer}
          onChange={e => onChange({ ...form, composer: e.target.value })}
          disabled={disabled}
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-copyright`}>Copyright amount (USD)</Label>
        <Input
          id={`${idPrefix}-copyright`}
          type="number"
          step="0.01"
          value={form.copyrightAmountUsd}
          onChange={e => onChange({ ...form, copyrightAmountUsd: e.target.value })}
          disabled={disabled}
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-licensing`}>Licensing status</Label>
        <Input
          id={`${idPrefix}-licensing`}
          value={form.licensingStatus}
          onChange={e => onChange({ ...form, licensingStatus: e.target.value })}
          placeholder="e.g. licensed, public domain, NYA"
          disabled={disabled}
        />
      </div>
    </>
  );
}

/** The pieces catalogue: create, edit and delete via Server Actions; re-reads the page after each. */
export function PiecesManager({ pieces, loadError }: { pieces: Piece[]; loadError?: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(loadError ?? null);
  const [filter, setFilter] = useState('');
  const [newForm, setNewForm] = useState<PieceForm>(EMPTY_FORM);
  const [editing, setEditing] = useState<Piece | null>(null);
  const [editForm, setEditForm] = useState<PieceForm>(EMPTY_FORM);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return pieces;
    return pieces.filter(
      p => p.title.toLowerCase().includes(q) || (p.composer ?? '').toLowerCase().includes(q)
    );
  }, [pieces, filter]);

  /** Runs one action; true on success. Re-reads the list either way. */
  const run = async (action: () => Promise<ActionResult<unknown>>): Promise<boolean> => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await action();
      if (!result.ok) setError(messageFor(result));
      router.refresh();
      return result.ok;
    } catch {
      setError('Something went wrong. Try again.');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.title.trim()) return;
    if (await run(() => createPiece(newForm))) setNewForm(EMPTY_FORM);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editForm.title.trim()) return;
    const id = editing.id;
    if (await run(() => updatePiece({ id, ...editForm }))) setEditing(null);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    const id = deletingId;
    await run(() => deletePiece({ id }));
    setDeletingId(null);
  };

  return (
    <div className="container mx-auto py-20">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Pieces</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex justify-between items-center mb-2">
        <h1 className="text-4xl font-bold">Manage Pieces</h1>
      </div>
      <p className="text-muted-foreground mb-8">
        Source works that show parts are built from. Link them to a part from the arrangement card in the show editor.
      </p>

      {error && (
        <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Add New Piece</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <PieceFields idPrefix="new" form={newForm} onChange={setNewForm} disabled={submitting} />
                <Button type="submit" className="w-full" disabled={submitting || !newForm.title.trim()}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Add Piece
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-4">
          <Input
            placeholder="Filter by title or composer"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            aria-label="Filter pieces"
          />
          <div className="border rounded-md bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Composer</TableHead>
                  <TableHead className="text-right">Copyright</TableHead>
                  <TableHead>Licensing</TableHead>
                  <TableHead className="text-right">Parts</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {pieces.length === 0 ? 'No pieces yet. Add one to get started.' : 'No pieces match that filter.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  visible.map(piece => (
                    <TableRow key={piece.id}>
                      <TableCell className="font-medium">{piece.title}</TableCell>
                      <TableCell>{piece.composer}</TableCell>
                      <TableCell className="text-right">
                        {piece.copyrightAmountUsd !== null ? `$${piece.copyrightAmountUsd}` : ''}
                      </TableCell>
                      <TableCell>{piece.licensingStatus}</TableCell>
                      <TableCell className="text-right">{piece.usageCount}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditing(piece);
                              setEditForm(toForm(piece));
                            }}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <AlertDialog
                            open={deletingId === piece.id}
                            onOpenChange={open => {
                              if (!open && submitting) return;
                              setDeletingId(open ? piece.id : null);
                            }}
                          >
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This permanently deletes &quot;{piece.title}&quot;
                                  {piece.usageCount > 0
                                    ? ` and removes it from the ${piece.usageCount} part${piece.usageCount === 1 ? '' : 's'} that use it.`
                                    : '.'}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={e => {
                                    e.preventDefault();
                                    handleDelete();
                                  }}
                                  disabled={submitting}
                                  className="bg-destructive text-destructive-foreground"
                                >
                                  {submitting ? 'Deleting...' : 'Delete'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <Dialog open={editing !== null} onOpenChange={open => { if (!open) setEditing(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Piece</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <PieceFields idPrefix="edit" form={editForm} onChange={setEditForm} disabled={submitting} />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={submitting}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={submitting || !editForm.title.trim()}>
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
