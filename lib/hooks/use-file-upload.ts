import { useState, useCallback } from 'react';

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
  onUploadSuccess?: (file: any) => void;
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

  const parseJsonResponse = async (response: Response): Promise<{ data: any; rawText: string }> => {
    const rawText = await response.text();
    if (!rawText) {
      return { data: null, rawText };
    }
    try {
      return { data: JSON.parse(rawText), rawText };
    } catch {
      return { data: null, rawText };
    }
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
        // Handle YouTube URL submission
        if (!uploadingFile.youtubeUrl) {
          throw new Error('YouTube URL is required');
        }

        const response = await fetch('/api/files/youtube', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: uploadingFile.youtubeUrl,
            fileType: uploadingFile.fileType,
            isPublic: uploadingFile.isPublic,
            description: uploadingFile.description,
            displayOrder: uploadingFile.displayOrder,
            showId,
            arrangementId,
          }),
        });

        const { data: result, rawText } = await parseJsonResponse(response);

        if (!response.ok) {
          throw new Error(result?.error || rawText || 'Upload failed');
        }

        updateFile(uploadingFile.id, {
          status: 'success',
          progress: 100,
        });

        if (result?.file) {
          onUploadSuccess?.(result.file);
        }
      } else {
        // Handle regular file upload (Direct to Storage via Signed URL)
        if (!uploadingFile.file) {
          throw new Error('File is required');
        }

        updateFile(uploadingFile.id, { progress: 10 });

        // 1. Get Signed Upload URL
        const signResponse = await fetch('/api/files/sign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: uploadingFile.file.name,
            fileType: uploadingFile.fileType,
            showId,
            arrangementId,
            isPublic: uploadingFile.isPublic,
          }),
        });

        const { data: signResult, rawText: signRaw } = await parseJsonResponse(signResponse);

        if (!signResponse.ok || !signResult) {
          throw new Error(signResult?.error || signRaw || 'Failed to get upload URL');
        }

        const { signedUrl, storagePath } = signResult.data;

        updateFile(uploadingFile.id, { progress: 20 });

        // 2. Upload to Supabase Storage directly (Client -> Storage)
        const uploadResponse = await fetch(signedUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': uploadingFile.file.type,
          },
          body: uploadingFile.file,
        });

        if (!uploadResponse.ok) {
          const errText = await uploadResponse.text();
          throw new Error(`Storage upload failed: ${uploadResponse.statusText} ${errText}`);
        }

        updateFile(uploadingFile.id, { progress: 80 });

        // 3. Record Metadata in DB
        const recordResponse = await fetch('/api/files', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storagePath,
            fileName: uploadingFile.file.name,
            fileType: uploadingFile.fileType,
            fileSize: uploadingFile.file.size,
            mimeType: uploadingFile.file.type,
            showId,
            arrangementId,
            isPublic: uploadingFile.isPublic,
            description: uploadingFile.description,
            displayOrder: uploadingFile.displayOrder,
          }),
        });

        const { data: recordResult, rawText: recordRaw } = await parseJsonResponse(recordResponse);

        if (!recordResponse.ok) {
          throw new Error(recordResult?.error || recordRaw || 'Failed to record file upload');
        }

        updateFile(uploadingFile.id, {
          status: 'success',
          progress: 100,
        });

        if (recordResult?.data) {
          onUploadSuccess?.(recordResult.data);
        }
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

