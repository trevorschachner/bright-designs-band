import { z } from 'zod';

const MAX_FILE_SIZES: Record<string, number> = {
  image: 10 * 1024 * 1024, // 10MB
  audio: 100 * 1024 * 1024, // 100MB
  pdf: 50 * 1024 * 1024, // 50MB
  score: 50 * 1024 * 1024, // 50MB
  other: 100 * 1024 * 1024, // 100MB
};

const ALLOWED_FILE_TYPES = ['image', 'audio', 'pdf', 'score', 'other'];

export const fileUploadSchema = z.object({
  file: z.any(),
  showId: z.preprocess(
    (a) => {
      if (!a || a === '' || a === 'undefined') return undefined;
      const parsed = parseInt(String(a), 10);
      return isNaN(parsed) ? undefined : parsed;
    },
    z.number().positive().optional()
  ),
  arrangementId: z.preprocess(
    (a) => {
      if (!a || a === '' || a === 'undefined') return undefined;
      const parsed = parseInt(String(a), 10);
      return isNaN(parsed) ? undefined : parsed;
    },
    z.number().positive().optional()
  ),
  fileType: z.enum(['image', 'audio', 'youtube', 'pdf', 'score', 'other']),
  isPublic: z.preprocess((a) => a === 'true' || a === true, z.boolean()),
  description: z.preprocess(
    (a) => (a === '' || a === 'undefined' ? undefined : a),
    z.string().optional()
  ),
  displayOrder: z.preprocess(
    (a) => {
      if (!a || a === '' || a === 'undefined') return undefined;
      const parsed = parseInt(String(a), 10);
      return isNaN(parsed) ? undefined : parsed;
    },
    z.number().int().min(0).optional()
  ),
}).refine(
  (data) => {
    const file = data.file;
    if (!file) return false;
    
    // Check file type matches allowed types
    const fileTypePrefix = file.type?.split('/')[0];
    const isPdf = file.type === 'application/pdf';
    if (!ALLOWED_FILE_TYPES.includes(fileTypePrefix) && !isPdf) {
      return false;
    }
    
    // Check file size based on fileType
    const maxSize = MAX_FILE_SIZES[data.fileType] || MAX_FILE_SIZES.other;
    return file.size <= maxSize;
  },
  (data) => {
    const file = data.file;
    if (!file) {
      return { message: 'File is required', path: ['file'] };
    }
    
    const fileTypePrefix = file.type?.split('/')[0];
    const isPdf = file.type === 'application/pdf';
    if (!ALLOWED_FILE_TYPES.includes(fileTypePrefix) && !isPdf) {
      return { message: 'Only .jpg, .gif, .png, .webp, .mp3, .wav, .ogg, and .pdf files are accepted.', path: ['file'] };
    }
    
    const maxSize = MAX_FILE_SIZES[data.fileType] || MAX_FILE_SIZES.other;
    const maxSizeMB = Math.round(maxSize / 1024 / 1024);
    return { message: `Max file size is ${maxSizeMB}MB for ${data.fileType} files.`, path: ['file'] };
  }
);

// ---------------------------------------------------------------------------
// Server Action payloads (lib/actions/files.ts). Strict: unknown keys rejected.
// ---------------------------------------------------------------------------

const fileRowId = z.number().int().positive();

/**
 * `setShowThumbnail`: point the show's thumbnail at one of its image files
 * (`fileId`), at a URL (`url`), or clear it (`url: null`). Exactly one of
 * `fileId` / `url` is required (checked by the action).
 */
export const setShowThumbnailSchema = z
  .object({
    showId: fileRowId,
    fileId: fileRowId.optional(),
    url: z.string().trim().max(2000, 'URL is too long').nullable().optional(),
  })
  .strict();
export type SetShowThumbnailInput = z.input<typeof setShowThumbnailSchema>;

/** `attachYouTube`: a YouTube link stored as a file row on a show and/or a part. */
export const attachYouTubeSchema = z
  .object({
    showId: fileRowId.optional(),
    arrangementId: fileRowId.optional(),
    url: z.string().trim().min(1, 'YouTube URL is required').max(500, 'URL is too long'),
    description: z.string().trim().max(500).nullable().optional(),
    isPublic: z.boolean().optional(),
    displayOrder: z.number().int().min(0).max(10_000).optional(),
  })
  .strict();
export type AttachYouTubeInput = z.input<typeof attachYouTubeSchema>;

export const fileIdSchema = z.object({ id: fileRowId }).strict();
