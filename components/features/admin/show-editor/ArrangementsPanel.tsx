'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { GalleryFile } from '@/components/features/file-gallery';
import { deleteArrangement, reorderArrangements } from '@/lib/actions/arrangements';
import { moveItem, type PieceSummary } from '@/lib/pieces/editor';
import type { EditableArrangement } from '@/lib/services/admin';
import { formatDuration } from '@/lib/utils';
import { ERROR_TEXT } from './action-errors';
import { ArrangementForm } from './ArrangementForm';
import { FilesPanel } from './FilesPanel';
import { PiecesPanel } from './PiecesPanel';
import type { TagOption } from './ShowFields';

type Props = {
  showId: number;
  showPercussionArranger: string | null;
  arrangements: EditableArrangement[];
  files: GalleryFile[];
  allTags: TagOption[];
  allPieces: PieceSummary[];
  onShowStamp: (updatedAt: string, thumbnailUrl: string | null) => void;
};

const gradeLabel = (grade: string) => (grade === '5_plus' ? '5+' : grade.replace('_', '-'));

/**
 * The show's parts in order. Up/down rewrite the order (`reorderArrangements`),
 * Add opens the form in a dialog, Edit swaps the card for the form, Delete
 * asks first. Each change re-reads the server data (router.refresh).
 */
export function ArrangementsPanel({ showId, showPercussionArranger, arrangements, files, allTags, allPieces, onShowStamp }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const tagName = new Map(allTags.map((t) => [t.id, t.name]));

  const refresh = () => startTransition(() => router.refresh());

  const move = (index: number, delta: number) => {
    const orderedIds = moveItem(arrangements, index, delta).map((a) => a.id);
    setError(null);
    startTransition(async () => {
      const result = await reorderArrangements({ showId, orderedIds });
      if (!result.ok) setError(result.issues?.[0]?.message ?? ERROR_TEXT[result.error]);
      router.refresh();
    });
  };

  const remove = (id: number) => {
    setError(null);
    startTransition(async () => {
      const result = await deleteArrangement({ id });
      if (!result.ok && result.error !== 'not_found') setError(ERROR_TEXT[result.error]);
      setDeletingId(null);
      router.refresh();
    });
  };

  return (
    <div className="max-w-6xl mx-auto mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Arrangements</h2>
        <Button onClick={() => setAdding(true)}>+ Add Arrangement</Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Arrangement</DialogTitle>
          </DialogHeader>
          {adding && (
            <ArrangementForm
              showId={showId}
              showPercussionArranger={showPercussionArranger}
              allTags={allTags}
              onSaved={() => {
                setAdding(false);
                refresh();
              }}
              onCancel={() => setAdding(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {arrangements.length === 0 && <p className="text-sm text-muted-foreground">No arrangements yet.</p>}

      <div className="space-y-6">
        {arrangements.map((arrangement, index) => (
          <Card key={arrangement.id} className="frame-card">
            <CardContent className="p-6">
              {editingId === arrangement.id ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Editing: {arrangement.title}</h3>
                  <ArrangementForm
                    showId={showId}
                    arrangement={arrangement}
                    allTags={allTags}
                    onSaved={() => {
                      setEditingId(null);
                      refresh();
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                    <div className="space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold">{arrangement.title || 'Untitled'}</h3>
                        {arrangement.scene && <Badge variant="outline" className="text-xs">{arrangement.scene}</Badge>}
                        {arrangement.grade && <Badge variant="secondary" className="text-xs">{gradeLabel(arrangement.grade)}</Badge>}
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="px-2 py-0.5 rounded-full bg-muted">Part {index + 1}</span>
                        {arrangement.durationSeconds != null && (
                          <span className="px-2 py-0.5 rounded-full bg-muted">{formatDuration(arrangement.durationSeconds)}</span>
                        )}
                        {arrangement.year && <span className="px-2 py-0.5 rounded-full bg-muted">{arrangement.year}</span>}
                      </div>
                      {(arrangement.composer || arrangement.arranger || arrangement.percussionArranger) && (
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {arrangement.composer && <span>Composer: {arrangement.composer}</span>}
                          {arrangement.arranger && <span>Arranger: {arrangement.arranger}</span>}
                          {arrangement.percussionArranger && <span>Percussion: {arrangement.percussionArranger}</span>}
                        </div>
                      )}
                      {arrangement.tagIds.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {arrangement.tagIds.map((id) => (
                            <Badge key={id} variant="secondary" className="text-xs">
                              {tagName.get(id) ?? `#${id}`}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="ghost" size="sm" aria-label={`Move ${arrangement.title} up`} disabled={pending || index === 0} onClick={() => move(index, -1)}>
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Move ${arrangement.title} down`}
                        disabled={pending || index === arrangements.length - 1}
                        onClick={() => move(index, 1)}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setEditingId(arrangement.id)}>
                        Edit
                      </Button>
                      <AlertDialog open={deletingId === arrangement.id} onOpenChange={(open) => setDeletingId(open ? arrangement.id : null)}>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete &ldquo;{arrangement.title}&rdquo;?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. The part, its piece links and its file records will be permanently deleted.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={(e) => {
                                e.preventDefault();
                                remove(arrangement.id);
                              }}
                              disabled={pending}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {pending ? 'Deleting...' : 'Delete'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  <PiecesPanel arrangement={arrangement} allPieces={allPieces} />
                  <FilesPanel
                    showId={showId}
                    arrangementId={arrangement.id}
                    files={files.filter((f) => f.arrangementId === arrangement.id)}
                    onShowStamp={onShowStamp}
                  />
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
