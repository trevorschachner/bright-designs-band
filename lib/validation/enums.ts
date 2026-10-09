/**
 * Postgres enum values as plain tuples. lib/database/schema.ts builds its
 * pgEnums from these; client-side forms import them from here so drizzle
 * (pg-core) never reaches the browser bundle. Pure: no imports.
 */
export const GRADE_BANDS = ['1_2', '3_4', '5_plus'] as const
export const SHOW_DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'] as const
export const ENSEMBLE_SIZES = ['small', 'medium', 'large'] as const
export const FILE_TYPES = ['image', 'audio', 'youtube', 'pdf', 'score', 'other'] as const
export const ARRANGEMENT_SCENES = ['Opener', 'Ballad', 'Closer'] as const

export type GradeBand = (typeof GRADE_BANDS)[number]
export type ShowDifficulty = (typeof SHOW_DIFFICULTIES)[number]
export type EnsembleSize = (typeof ENSEMBLE_SIZES)[number]
export type ArrangementScene = (typeof ARRANGEMENT_SCENES)[number]

export const SHOW_INCLUDES = ['winds', 'percussion', 'sound design', 'drill', 'choreography', 'props', 'graphic'] as const
export type ShowInclude = (typeof SHOW_INCLUDES)[number]
