/**
 * Row shapes and CSV encoding for `npm run export:shows` (#51).
 *
 * The column order of each CSV matches a tab of the "Show Database" Google
 * Sheet, so an export can be pasted straight in. Changing an order here
 * changes what lines up with the sheet: update the sheet, the issue's field
 * mapping and the test together.
 *
 * Pure: the script does the reading, this does the shaping.
 */

import { publicStorageUrl } from '../media/public-url';

export const SHOW_COLUMNS = [
  'id',
  'title',
  'slug',
  'description',
  'duration',
  'difficulty',
  'thumbnail_url',
  'graphic_url',
  'youtube_url',
  'video_url',
  'year',
  'commissioned',
  'program_coordinator',
  'percussion_arranger',
  'sound_designer',
  'wind_arranger',
  'drill_writer',
  'ensemble_size',
  'includes',
  'tags',
  'featured',
  'display_order',
  // Last, so the sheet's positional IMPORTDATA tabs keep their existing columns.
  'program_notes',
] as const;

export const PART_COLUMNS = [
  'id',
  'show',
  'part',
  'title',
  'scene',
  'duration_seconds',
  'grade',
  'ensemble_size',
  'arranger',
  'percussion_arranger',
  'year',
  'commissioned',
  'youtube_url',
  'sample_score_url',
  'audio',
  'pieces',
] as const;

export const PIECE_COLUMNS = ['id', 'title', 'composer', 'copyright_amount_usd', 'licensing_status'] as const;

type Cell = string | number | boolean | null | undefined;
export type Row<C extends readonly string[]> = Record<C[number], Cell>;

export type ShowRecord = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  duration: string | null;
  difficulty: string | null;
  thumbnailUrl: string | null;
  graphicUrl: string | null;
  youtubeUrl: string | null;
  videoUrl: string | null;
  year: number | null;
  commissioned: string | null;
  programCoordinator: string | null;
  percussionArranger: string | null;
  soundDesigner: string | null;
  windArranger: string | null;
  drillWriter: string | null;
  featured: boolean;
  displayOrder: number;
  ensembleSize?: string | null;
  /** Comma-separated subset of SHOW_INCLUDES, as stored. */
  includes?: string | null;
  programNotes?: string | null;
  tagNames: string[];
};

export type PartRecord = {
  id: number;
  showTitle: string | null;
  orderIndex: number | null;
  title: string;
  scene: string | null;
  durationSeconds: number | null;
  grade: string | null;
  ensembleSize: string | null;
  arranger: string | null;
  percussionArranger: string | null;
  year: number | null;
  commissioned: string | null;
  youtubeUrl: string | null;
  sampleScoreUrl: string | null;
  audioUrl: string | null;
  pieceTitles: string[];
};

export type PieceRecord = {
  id: number;
  title: string;
  composer: string | null;
  copyrightAmountUsd: string | null;
  licensingStatus: string | null;
};

/** Comma list for a single cell. The CSV encoder quotes it. */
const list = (items: readonly string[] | null | undefined) => (items ?? []).join(', ');

export function showRow(s: ShowRecord): Row<typeof SHOW_COLUMNS> {
  return {
    id: s.id,
    title: s.title,
    slug: s.slug,
    description: s.description,
    duration: s.duration,
    difficulty: s.difficulty,
    thumbnail_url: s.thumbnailUrl,
    graphic_url: s.graphicUrl,
    youtube_url: s.youtubeUrl,
    video_url: s.videoUrl,
    year: s.year,
    commissioned: s.commissioned,
    program_coordinator: s.programCoordinator,
    percussion_arranger: s.percussionArranger,
    sound_designer: s.soundDesigner,
    wind_arranger: s.windArranger,
    drill_writer: s.drillWriter,
    ensemble_size: s.ensembleSize ?? null,
    includes: s.includes || null,
    tags: list(s.tagNames),
    featured: s.featured,
    display_order: s.displayOrder,
    program_notes: s.programNotes ? s.programNotes.replace(/(?:\r?\n)+/g, ' ') : null,
  };
}

export function partRow(p: PartRecord): Row<typeof PART_COLUMNS> {
  return {
    id: p.id,
    show: p.showTitle,
    part: p.orderIndex,
    title: p.title,
    scene: p.scene,
    duration_seconds: p.durationSeconds,
    grade: p.grade,
    ensemble_size: p.ensembleSize,
    arranger: p.arranger,
    percussion_arranger: p.percussionArranger,
    year: p.year,
    commissioned: p.commissioned,
    youtube_url: p.youtubeUrl,
    sample_score_url: p.sampleScoreUrl,
    audio: p.audioUrl,
    pieces: list(p.pieceTitles),
  };
}

export function pieceRow(p: PieceRecord): Row<typeof PIECE_COLUMNS> {
  return {
    id: p.id,
    title: p.title,
    composer: p.composer,
    copyright_amount_usd: p.copyrightAmountUsd,
    licensing_status: p.licensingStatus,
  };
}

/** RFC 4180 cell: quote when needed, double embedded quotes. Booleans as TRUE/FALSE for Sheets. */
export function csvCell(value: Cell): string {
  if (value === null || value === undefined) return '';
  const text = typeof value === 'boolean' ? (value ? 'TRUE' : 'FALSE') : String(value);
  return /[",\r\n]|^\s|\s$/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv<C extends readonly string[]>(columns: C, rows: readonly Row<C>[]): string {
  const lines = [columns.join(',')];
  for (const row of rows) lines.push(columns.map(c => csvCell(row[c as C[number]])).join(','));
  return lines.join('\r\n') + '\r\n';
}

/**
 * Public URL for a stored file. `files.url` is already absolute for every
 * audio row today; a bare storage path is resolved the same way the shows API
 * does (bucket + root prefix).
 */
export function publicFileUrl(
  urlOrPath: string | null | undefined,
  opts: { supabaseUrl?: string | null; bucket: string; rootPrefix: string }
): string | null {
  if (!urlOrPath) return null;
  if (/^https?:\/\//.test(urlOrPath)) return urlOrPath;
  const base = opts.supabaseUrl?.trim().replace(/\/$/, '');
  if (!base) return null;
  return publicStorageUrl(opts.bucket, `${opts.rootPrefix}/${urlOrPath}`, base);
}
