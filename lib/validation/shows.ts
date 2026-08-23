import { z } from 'zod';
import { createInsertSchema } from 'drizzle-zod';
import { shows } from '@/lib/database/schema';

/**
 * Payload accepted by `POST /api/shows`.
 *
 * Generated from the Drizzle table rather than restated by hand. The previous
 * hand-written version declared seven columns that do not exist on `shows`
 * (`quantity`, `instrumentation`, `composer`, `arranger`, `lyricist`,
 * `songTitle`, `bpm`) and omitted nine that do. Nothing broke only because the
 * insert enumerates its columns explicitly instead of spreading the parsed
 * body; it was one `...spread` away from a live defect. Same failure as the
 * filter schema, which offered filters for columns that had not existed in
 * nine months.
 *
 * Deliberately narrow. Shows are created with the fields the new-show form
 * collects and enriched afterwards by editing, so the credit columns
 * (`commissioned`, `programCoordinator`, `percussionArranger`,
 * `soundDesigner`, `windArranger`, `drillWriter`) and `featured`, `graphicUrl`
 * and `youtubeUrl` are settable only through `PUT /api/shows/[id]`. Widening
 * this would be inert until the form sends them.
 *
 * `slug` is omitted because the route derives it from the title and resolves
 * collisions itself.
 */

const CREATABLE = {
  title: true,
  description: true,
  year: true,
  difficulty: true,
  duration: true,
  price: true,
  thumbnailUrl: true,
  videoUrl: true,
  displayOrder: true,
} as const;

/**
 * Titles arrive with stray whitespace often enough to matter: 31 of 73
 * arrangement titles and 9 show titles had untrimmed values as of 2026-08-23.
 * `slug` is generated from `title`, so a trailing space becomes a bad URL, and
 * exact-match filters and ordering both treat `'Foo '` and `'Foo'` as
 * different.
 */
const trimmed = (schema: z.ZodString) => schema.trim();

export const showSchema = createInsertSchema(shows, {
  title: schema => trimmed(schema).min(1, 'Title is required'),
  description: schema => trimmed(schema),
  duration: schema => trimmed(schema),
  thumbnailUrl: schema => trimmed(schema),
  videoUrl: schema => trimmed(schema),
})
  .pick(CREATABLE)
  .extend({
    /**
     * `price` is a Postgres `numeric`, which Drizzle carries as a string to
     * avoid float precision loss, so the generated schema would accept only
     * strings. The previous hand-written schema declared `z.number()`, so
     * callers send numbers. Both are accepted and normalised to the string
     * form the column wants.
     */
    price: z
      .union([z.number(), z.string()])
      .nullable()
      .optional()
      .transform(value => (value === null || value === undefined ? null : String(value))),
    tags: z.array(z.number()).optional(),
  });

export type ShowInput = z.infer<typeof showSchema>;
