'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { ShowForEdit } from '@/lib/services/admin';
import { ArrangementsPanel } from './ArrangementsPanel';
import { FilesPanel } from './FilesPanel';
import { ShowForm } from './ShowForm';
import { ShowSummaryCard } from './ShowSummaryCard';
import type { TagOption } from './ShowFields';

type Props =
  | { mode: 'create'; allTags: TagOption[] }
  | { mode: 'edit'; initial: ShowForEdit; notice?: string };

/**
 * The admin show editor shell. Holds the show's current `updated_at`: it
 * starts from the server read and is replaced only by what this editor's own
 * actions return (save, thumbnail, a delete that cleared the art), never by a
 * later refresh, so a save over someone else's change is still `stale`.
 * Panels save on their own; every change re-reads the server data.
 */
export function ShowEditor(props: Props) {
  if (props.mode === 'create') {
    return (
      <div className="max-w-2xl mx-auto">
        <ShowForm mode="create" allTags={props.allTags} />
      </div>
    );
  }
  return <EditShow initial={props.initial} notice={props.notice} />;
}

function EditShow({ initial, notice }: { initial: ShowForEdit; notice?: string }) {
  const { show, arrangements, files, allTags, allPieces } = initial;
  const [updatedAt, setUpdatedAt] = useState(show.updatedAt);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null | undefined>(undefined);

  const onStamp = (stamp: string, thumbnail?: string | null) => {
    setUpdatedAt(stamp);
    if (thumbnail !== undefined) setThumbnailUrl(thumbnail);
  };

  return (
    <div className="container mx-auto py-8 max-w-7xl pb-24">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Edit Show</h1>
          <p className="text-muted-foreground">Update show details and manage arrangements</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/shows">← Back to Shows</Link>
        </Button>
      </div>

      {notice && (
        <Alert variant="destructive" className="max-w-4xl mx-auto mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}

      <div className="max-w-4xl mx-auto mb-8 space-y-6">
        <ShowSummaryCard show={show} allTags={allTags} partCount={arrangements.length} />
        <ShowForm
          mode="edit"
          show={show}
          allTags={allTags}
          updatedAt={updatedAt}
          thumbnailUrl={thumbnailUrl}
          onStamp={onStamp}
        />
      </div>

      <ArrangementsPanel
        showId={show.id}
        showPercussionArranger={show.percussionArranger}
        arrangements={arrangements}
        files={files}
        allTags={allTags}
        allPieces={allPieces}
        onShowStamp={onStamp}
      />

      <FilesPanel showId={show.id} files={files.filter((f) => f.showId === show.id)} onShowStamp={onStamp} />
    </div>
  );
}
