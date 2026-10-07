import { z } from 'zod';
import { createInsertSchema } from 'drizzle-zod';
import { shows, showDifficultyEnum } from '@/lib/database/schema';
import { concurrencyStamp, rowId } from './concurrency';

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

const showInsertSchema = createInsertSchema(shows, {
  title: schema => trimmed(schema).min(1, 'Title is required'),
  description: schema => trimmed(schema),
  duration: schema => trimmed(schema),
  thumbnailUrl: schema => trimmed(schema),
  videoUrl: schema => trimmed(schema),
});

export const showSchema = showInsertSchema
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

/**
 * Payload accepted by `PUT /api/shows/[id]`.
 *
 * The handler used to spread the request body straight into `.set()`, so any
 * column was writable, `id`, `createdAt` and `price` included. Every key is
 * now optional (the editor sends a full snapshot, other callers send one or
 * two fields) and any key not listed here is rejected.
 *
 * `price` is excluded deliberately: no editor sets it and it is not a field a
 * show edit should be able to change. `id`, `createdAt` and `updatedAt` are
 * server-owned.
 *
 * `slug` is accepted only when sent explicitly. It used to be recomputed from
 * `title` on every save, so the editor's auto-save silently changed public
 * URLs whenever a title was touched.
 */
const UPDATABLE = {
  title: true,
  description: true,
  year: true,
  difficulty: true,
  duration: true,
  thumbnailUrl: true,
  videoUrl: true,
  displayOrder: true,
  featured: true,
  youtubeUrl: true,
  commissioned: true,
  programCoordinator: true,
  percussionArranger: true,
  soundDesigner: true,
  windArranger: true,
  drillWriter: true,
} as const;

export const updateShowSchema = showInsertSchema
  .pick(UPDATABLE)
  .extend({
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase words separated by hyphens'),
    /**
     * The admin editor's difficulty select has an empty "Select difficulty..."
     * option and sends `''` when nothing is chosen. `''` is not a value of the
     * Postgres enum, so it is read as "no difficulty".
     */
    difficulty: z.preprocess(
      value => (value === '' ? null : value),
      z.enum(showDifficultyEnum.enumValues).nullable()
    ),
    /** Tag ids. When present they replace the show's tags; when absent tags are untouched. */
    tags: z.array(z.number().int()),
  })
  .partial()
  .strict();

export type UpdateShowInput = z.infer<typeof updateShowSchema>;

// ---------------------------------------------------------------------------
// Server Action payloads (lib/actions/shows.ts)
// ---------------------------------------------------------------------------

/** `createShow`: the POST /api/shows payload, strict (unknown keys rejected). */
export const createShowSchema = showSchema.strict();
/**
 * drizzle-zod types the refined nullable columns (description, duration,
 * thumbnailUrl, videoUrl) as required in `z.input`, though the schema accepts
 * them absent. Only `title` is required.
 */
export type CreateShowInput = { title: string } & Partial<Omit<z.input<typeof createShowSchema>, 'title'>>;

/**
 * `updateShow`: the PUT payload plus the show `id` and the `updatedAt` the
 * caller loaded. Still strict and still partial: `slug` and `tags` change
 * only when sent.
 */
export const updateShowActionSchema = updateShowSchema.extend({
  id: rowId,
  updatedAt: concurrencyStamp,
});
export type UpdateShowActionInput = z.input<typeof updateShowActionSchema>;

export const showIdSchema = z.object({ id: rowId }).strict();

export const setShowTagsSchema = z
  .object({ showId: rowId, tagIds: z.array(rowId).max(200) })
  .strict();

export const setFeaturedSchema = z.object({ showId: rowId, featured: z.boolean() }).strict();
