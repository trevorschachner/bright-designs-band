'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileGallery, type GalleryFile } from '@/components/features/file-gallery';
import { FileUpload } from '@/components/features/file-upload';
import { YouTubeUpload } from '@/components/features/youtube-upload';
import { setShowThumbnail, type DeletedFile } from '@/lib/actions/files';
import { ERROR_TEXT } from './action-errors';

type Props = {
  showId: number;
  /** Files of one part (its card), or of the whole show (the "Additional Show Files" section). */
  arrangementId?: number;
  files: GalleryFile[];
  /** A thumbnail change or a delete that cleared the show's art bumped the show's `updated_at`. */
  onShowStamp: (updatedAt: string, thumbnailUrl: string | null) => void;
};

/**
 * Upload (via `useFileUpload` inside FileUpload), YouTube links, the gallery,
 * set-as-thumbnail and delete. Every change re-reads the editor's server data
 * (router.refresh), so the gallery shows what the database holds.
 */
export function FilesPanel({ showId, arrangementId, files, onShowStamp }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const refresh = () => router.refresh();

  const onDeleted = (_fileId: number, result: DeletedFile) => {
    if (result.show) onShowStamp(result.show.updatedAt, result.show.thumbnailUrl);
    refresh();
  };

  const onSetThumbnail = async (_url: string, fileId: number) => {
    setError(null);
    const result = await setShowThumbnail({ showId, fileId });
    if (!result.ok) return setError(ERROR_TEXT[result.error]);
    onShowStamp(result.data.updatedAt, result.data.thumbnailUrl);
    refresh();
  };

  const uploadError = (message: string) => setError(message);

  if (arrangementId) {
    return (
      <div className="mt-3 pt-3 border-t space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-xs font-semibold text-muted-foreground tracking-wide">Files</h4>
          <FileUpload
            arrangementId={arrangementId}
            showId={showId}
            allowedTypes={['audio', 'image', 'pdf', 'score']}
            variant="button"
            onUploadSuccess={refresh}
            onUploadError={uploadError}
          />
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="bg-white rounded border border-border">
          <FileGallery arrangementId={arrangementId} files={files} editable onFileDelete={onDeleted} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-12 mb-24">
      <h2 className="text-2xl font-bold mb-4">Additional Show Files</h2>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-1 gap-8">
        <div className="flex gap-4 items-start">
          <FileUpload
            showId={showId}
            title="Additional File Uploads"
            description="Upload supporting audio, scores, or documents for this show."
            variant="button"
            onUploadSuccess={refresh}
            onUploadError={uploadError}
          />
          <YouTubeUpload showId={showId} onUploadSuccess={refresh} onUploadError={uploadError} />
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-3">Gallery</h3>
          <FileGallery showId={showId} files={files} editable onFileDelete={onDeleted} onSetAsThumbnail={onSetThumbnail} />
        </div>
      </div>
    </div>
  );
}
