'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PerusalScoreFile } from '@/lib/services/admin';
import { uploadPerusalScore } from '@/lib/uploads/direct-upload';

type Props = {
  showId: number;
  arrangementId: number;
  /** The file the slot holds now, or null. */
  score: PerusalScoreFile | null;
};

const uploadedOn = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';

/**
 * A part's one Perusal score: the full score PDF, always private (staff open it
 * through /api/files/<id>/download). Upload fills the slot; Replace points it at the
 * new file and removes the old one. Re-reads the editor's data afterwards.
 */
export function PerusalScoreSlot({ showId, arrangementId, score }: Props) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const uploading = progress !== null;

  const onFile = async (file: File | undefined) => {
    if (input.current) input.current.value = '';
    if (!file) return;
    setError(null);
    setNotice(null);
    if (file.type !== 'application/pdf') return setError('Choose a PDF file.');
    setProgress(0);
    try {
      const result = await uploadPerusalScore({ file, showId, arrangementId, onProgress: setProgress });
      if (!result.previousRemoved) setNotice('The old score could not be removed; delete it from Files.');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The upload failed. Try again.');
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-xs font-semibold text-muted-foreground tracking-wide flex items-center gap-1">
          Perusal score
          <Lock className="h-3 w-3" aria-label="Private" />
        </h4>
        <input
          ref={input}
          type="file"
          accept="application/pdf"
          className="hidden"
          aria-label={`Perusal score PDF for part ${arrangementId}`}
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => input.current?.click()}>
          {uploading ? `Uploading... ${progress}%` : score ? 'Replace' : 'Upload PDF'}
        </Button>
      </div>
      {score ? (
        <p className="text-sm flex items-center gap-2 min-w-0">
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <a href={`/api/files/${score.id}/download`} target="_blank" rel="noopener noreferrer" className="truncate underline-offset-2 hover:underline">
            {score.originalName}
          </a>
          <span className="text-xs text-muted-foreground shrink-0">{uploadedOn(score.createdAt)}</span>
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">No perusal score yet.</p>
      )}
      {notice && <p className="text-xs text-muted-foreground">{notice}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
