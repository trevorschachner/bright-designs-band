import { z } from 'zod';

export const showSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  year: z.number().int().positive().optional().nullable(),
  price: z.number().positive().optional().nullable(),
  quantity: z.number().int().positive().optional().nullable(),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
  instrumentation: z.string().optional(),
  composer: z.string().optional(),
  arranger: z.string().optional(),
  lyricist: z.string().optional(),
  songTitle: z.string().optional(),
  bpm: z.number().int().positive().optional().nullable(),
  duration: z.string().optional(),
  tags: z.array(z.number()).optional(),
});
