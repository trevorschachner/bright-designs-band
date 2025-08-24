import { z } from 'zod';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ['image', 'audio', 'pdf', 'score', 'other'];

export const fileUploadSchema = z.object({
  file: z
    .any()
    .refine((file) => file?.size <= MAX_FILE_SIZE, `Max file size is 10MB.`)
    .refine(
      (file) => ALLOWED_FILE_TYPES.includes(file?.type.split('/')[0]) || ALLOWED_FILE_TYPES.includes(file?.type),
      "Only .jpg, .gif, .png, .webp, .mp3, .wav, .ogg, and .pdf files are accepted."
    ),
  showId: z.preprocess((a) => parseInt(z.string().parse(a)), z.number().positive().optional()),
  arrangementId: z.preprocess((a) => parseInt(z.string().parse(a)), z.number().positive().optional()),
  fileType: z.enum(['image', 'audio', 'youtube', 'pdf', 'score', 'other']),
  isPublic: z.preprocess((a) => a === 'true', z.boolean()),
  description: z.string().optional(),
  displayOrder: z.preprocess((a) => parseInt(z.string().parse(a)), z.number().int().min(0).optional()),
});
