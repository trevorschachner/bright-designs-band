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
    if (!ALLOWED_FILE_TYPES.includes(fileTypePrefix) && !ALLOWED_FILE_TYPES.includes(file.type)) {
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
    if (!ALLOWED_FILE_TYPES.includes(fileTypePrefix) && !ALLOWED_FILE_TYPES.includes(file.type)) {
      return { message: 'Only .jpg, .gif, .png, .webp, .mp3, .wav, .ogg, and .pdf files are accepted.', path: ['file'] };
    }
    
    const maxSize = MAX_FILE_SIZES[data.fileType] || MAX_FILE_SIZES.other;
    const maxSizeMB = Math.round(maxSize / 1024 / 1024);
    return { message: `Max file size is ${maxSizeMB}MB for ${data.fileType} files.`, path: ['file'] };
  }
);
