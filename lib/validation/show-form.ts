import { z } from 'zod'
import { SHOW_DIFFICULTIES } from './enums'
import type { EditableShow } from '@/lib/services/admin'
import type { CreateShowInput, UpdateShowActionInput } from './shows'

/**
 * The admin show form (components/features/admin/show-editor/ShowForm.tsx).
 *
 * Inputs produce strings, so the form holds strings and is checked in the
 * browser with this schema (same rules and messages as `updateShowSchema`:
 * required title, slug pattern). `showFormToUpdate` / `showFormToCreate`
 * convert to the action payloads, which the server checks again with the
 * strict action schemas; an `invalid` result's issue paths are these field
 * names.
 */

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const SLUG_MESSAGE = 'Slug must be lowercase words separated by hyphens'

const DIFFICULTIES = ['', ...SHOW_DIFFICULTIES] as const

export const showFormSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(300, 'Title is too long'),
  slug: z.string().trim().regex(SLUG_PATTERN, SLUG_MESSAGE),
  description: z.string(),
  year: z.string().trim().regex(/^(\d{4})?$/, 'Year must be four digits'),
  difficulty: z.enum(DIFFICULTIES),
  duration: z.string(),
  thumbnailUrl: z.string(),
  videoUrl: z.string(),
  youtubeUrl: z.string(),
  featured: z.boolean(),
  displayOrder: z.string().trim().regex(/^-?\d*$/, 'Display order must be a whole number'),
  windArranger: z.string(),
  percussionArranger: z.string(),
  soundDesigner: z.string(),
  drillWriter: z.string(),
  programCoordinator: z.string(),
  commissioned: z.string(),
  tags: z.array(z.number()),
})

export type ShowFormValues = z.infer<typeof showFormSchema>

/** New shows default to these credits, as the old editor did. */
export const DEFAULT_WIND_ARRANGER = 'Brighton Barrineau, Trevor Schachner'

export function showFormDefaults(show?: EditableShow): ShowFormValues {
  return {
    title: show?.title ?? '',
    // Create mode derives the slug on the server; a valid placeholder keeps the schema happy.
    slug: show?.slug ?? 'new-show',
    description: show?.description ?? '',
    year: show?.year != null ? String(show.year) : '',
    difficulty: show ? (show.difficulty ?? '') : 'Intermediate',
    duration: show?.duration ?? '',
    thumbnailUrl: show?.thumbnailUrl ?? '',
    videoUrl: show?.videoUrl ?? '',
    youtubeUrl: show?.youtubeUrl ?? '',
    featured: show?.featured ?? false,
    displayOrder: String(show?.displayOrder ?? 0),
    // As the old editor: an empty wind credit is prefilled (saved on the next Save).
    windArranger: show?.windArranger ?? DEFAULT_WIND_ARRANGER,
    percussionArranger: show?.percussionArranger ?? '',
    soundDesigner: show?.soundDesigner ?? '',
    drillWriter: show?.drillWriter ?? '',
    programCoordinator: show?.programCoordinator ?? '',
    commissioned: show?.commissioned ?? '',
    tags: show?.tagIds ?? [],
  }
}

const text = (value: string) => (value.trim() === '' ? null : value.trim())
const year = (value: string) => (value.trim() ? Number(value) : null)

/** Form → `updateShow` payload. `slug` is sent only when `withSlug` (the "Edit URL" toggle). */
export function showFormToUpdate(
  values: ShowFormValues,
  ids: { id: number; updatedAt: string },
  withSlug: boolean
): UpdateShowActionInput {
  return {
    ...ids,
    title: values.title.trim(),
    ...(withSlug ? { slug: values.slug.trim() } : {}),
    description: text(values.description),
    year: year(values.year),
    difficulty: values.difficulty === '' ? null : values.difficulty,
    duration: text(values.duration),
    thumbnailUrl: text(values.thumbnailUrl),
    videoUrl: text(values.videoUrl),
    youtubeUrl: text(values.youtubeUrl),
    featured: values.featured,
    displayOrder: Number(values.displayOrder || 0),
    windArranger: text(values.windArranger),
    percussionArranger: text(values.percussionArranger),
    soundDesigner: text(values.soundDesigner),
    drillWriter: text(values.drillWriter),
    programCoordinator: text(values.programCoordinator),
    commissioned: text(values.commissioned),
    tags: values.tags,
  }
}

/** Form → `createShow` payload: the creatable fields only (credits are set by editing). */
export function showFormToCreate(values: ShowFormValues): CreateShowInput {
  return {
    title: values.title.trim(),
    description: text(values.description),
    year: year(values.year),
    difficulty: values.difficulty === '' ? null : values.difficulty,
    duration: text(values.duration),
    displayOrder: Number(values.displayOrder || 0),
    tags: values.tags,
  }
}
