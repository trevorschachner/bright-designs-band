import { useState, useCallback } from 'react';
import { attachYouTube } from '@/lib/actions/files';
import { uploadFileDirect } from '@/lib/uploads/direct-upload';

export type FileType = 'image' | 'audio' | 'youtube' | 'pdf' | 'score' | 'other';

export interface UploadingFile {
  file?: File;
  fileType: FileType;
  description: string;
  isPublic: boolean;
  displayOrder: number;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  id: string;
  youtubeUrl?: string;
}

interface UseFileUploadOptions {
  showId?: number;
  arrangementId?: number;
  maxFiles?: number;
  /** The recorded file (an upload) or the attached link (YouTube): both carry `id` and `url`. */
  onUploadSuccess?: (file: { id: number; url: string }) => void;
  onUploadError?: (error: string) => void;
}

export function useFileUpload({
  showId,
  arrangementId,
  maxFiles = 10,
  onUploadSuccess,
  onUploadError,
}: UseFileUploadOptions) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

  const detectFileType = (file: File): FileType => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type === 'application/pdf') return 'pdf';
    return 'other';
  };

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const newFiles: UploadingFile[] = Array.from(files).map((file) => ({
      file,
      fileType: detectFileType(file),
      description: '',
      isPublic: true,
      displayOrder: uploadingFiles.length,
      progress: 0,
      status: 'pending' as const,
      id: Math.random().toString(36).substring(2, 15),
    }));

    if (uploadingFiles.length + newFiles.length > maxFiles) {
      onUploadError?.(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setUploadingFiles((prev) => [...prev, ...newFiles]);
  }, [uploadingFiles.length, maxFiles, onUploadError]);

  const updateFile = useCallback((id: string, updates: Partial<UploadingFile>) => {
    setUploadingFiles((prev) =>
      prev.map((file) => (file.id === id ? { ...file, ...updates } : file))
    );
  }, []);

  const removeFile = useCallback((id: string) => {
    setUploadingFiles((prev) => prev.filter((file) => file.id !== id));
  }, []);

  const uploadFile = useCallback(async (uploadingFile: UploadingFile) => {
    updateFile(uploadingFile.id, { status: 'uploading', progress: 5 });

    try {
      if (uploadingFile.fileType === 'youtube') {
        if (!uploadingFile.youtubeUrl) {
          throw new Error('YouTube URL is required');
        }
        const result = await attachYouTube({
          url: uploadingFile.youtubeUrl,
          isPublic: uploadingFile.isPublic,
          description: uploadingFile.description || null,
          displayOrder: uploadingFile.displayOrder,
          showId,
          arrangementId,
        });
        if (!result.ok) {
          throw new Error(result.issues?.[0]?.message ?? 'Could not add the YouTube link');
        }
        updateFile(uploadingFile.id, { status: 'success', progress: 100 });
        onUploadSuccess?.(result.data);
      } else {
        if (!uploadingFile.file) {
          throw new Error('File is required');
        }
        const recorded = await uploadFileDirect({
          file: uploadingFile.file,
          fileType: uploadingFile.fileType,
          showId,
          arrangementId,
          isPublic: uploadingFile.isPublic,
          description: uploadingFile.description,
          displayOrder: uploadingFile.displayOrder,
          onProgress: (progress) => updateFile(uploadingFile.id, { progress }),
        });
        updateFile(uploadingFile.id, { status: 'success', progress: 100 });
        onUploadSuccess?.(recorded);
      }
    } catch (error) {
      console.error('Upload flow error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      updateFile(uploadingFile.id, {
        status: 'error',
        progress: 0,
        error: errorMessage,
      });
      onUploadError?.(errorMessage);
    }
  }, [showId, arrangementId, onUploadSuccess, onUploadError, updateFile]);

  const uploadAllFiles = useCallback(async () => {
    const pendingFiles = uploadingFiles.filter((f) => f.status === 'pending');

    for (const file of pendingFiles) {
      await uploadFile(file);
    }
  }, [uploadingFiles, uploadFile]);

  return {
    uploadingFiles,
    handleFileSelect,
    updateFile,
    removeFile,
    uploadFile,
    uploadAllFiles,
  };
}

