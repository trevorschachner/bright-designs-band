/** Admin reads: the dashboard (./admin-dashboard.ts), the inquiries and arrangements lists, and the show editor. Uncached; throw on a database failure. */

import { db } from '@/lib/database';
import { shows, arrangements, files, tags, contactSubmissions, arrangementPieces, pieces, showArrangements } from '@/lib/database/schema';
import { asc, count, eq, inArray, or } from 'drizzle-orm';
import type { GalleryFile } from '@/components/features/file-gallery';
import type { PieceSummary } from '@/lib/pieces/editor';
import { toIso } from './cache';
import { showWhere } from './shows';
import { getTagsForAdmin, type AdminTagRow } from './tags';

export * from './admin-dashboard';

export async function getDashboardStats() {
  const [[showCount], [arrangementCount], [contactCount], [fileCount], [tagCount]] = await Promise.all([
    db.select({ count: count() }).from(shows),
    db.select({ count: count() }).from(arrangements),
    db.select({ count: count() }).from(contactSubmissions),
    db.select({ count: count() }).from(files),
    db.select({ count: count() }).from(tags),
  ]);

  return {
    totalShows: showCount.count,
    totalArrangements: arrangementCount.count,
    totalContacts: contactCount.count,
    totalFiles: fileCount.count,
    totalTags: tagCount.count,
  };
}

// ---------------------------------------------------------------------------
// The show editor (app/admin/shows/[id]): one uncached read of everything it edits.
// ---------------------------------------------------------------------------


export type EditablePiece = PieceSummary & {
  copyrightAmountUsd: string | null;
  licensingStatus: string | null;
  orderIndex: number;
};

export type EditableArrangement = {
  id: number;
  title: string;
  composer: string | null;
  arranger: string | null;
  percussionArranger: string | null;
  description: string | null;
  grade: '1_2' | '3_4' | '5_plus' | null;
  scene: 'Opener' | 'Ballad' | 'Closer' | null;
  ensembleSize: 'small' | 'medium' | 'large' | null;
  year: number | null;
  durationSeconds: number | null;
  youtubeUrl: string | null;
  commissioned: string | null;
  sampleScoreUrl: string | null;
  featured: boolean;
  orderIndex: number;
  updatedAt: string;
  tagIds: number[];
  pieces: EditablePiece[];
};

export type EditableShow = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  year: number | null;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | null;
  duration: string | null;
  programNotes: string | null;
  ensembleSize: 'small' | 'medium' | 'large' | null;
  includes: string | null;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  youtubeUrl: string | null;
  featured: boolean;
  displayOrder: number;
  commissioned: string | null;
  programCoordinator: string | null;
  percussionArranger: string | null;
  soundDesigner: string | null;
  windArranger: string | null;
  drillWriter: string | null;
  updatedAt: string;
  tagIds: number[];
};

export type ShowForEdit = {
  show: EditableShow;
  arrangements: EditableArrangement[];
  /** Files on the show or on any of its parts. */
  files: GalleryFile[];
  allTags: AdminTagRow[];
  allPieces: PieceSummary[];
};

type ArrangementWithLinks = typeof arrangements.$inferSelect & {
  arrangementsToTags: { tagId: number }[];
  arrangementPieces: { orderIndex: number; piece: typeof pieces.$inferSelect }[];
};

/** A part row with its tag ids and ordered pieces, as the part form edits it. */
function toEditableArrangement(a: ArrangementWithLinks, orderIndex: number): EditableArrangement {
  return {
    id: a.id,
    title: a.title,
    composer: a.composer,
    arranger: a.arranger,
    percussionArranger: a.percussionArranger,
    description: a.description,
    grade: a.grade,
    scene: a.scene,
    ensembleSize: a.ensembleSize,
    year: a.year,
    durationSeconds: a.durationSeconds,
    youtubeUrl: a.youtubeUrl,
    commissioned: a.commissioned,
    sampleScoreUrl: a.sampleScoreUrl,
    featured: a.featured,
    orderIndex,
    updatedAt: toIso(a.updatedAt) ?? '',
    tagIds: a.arrangementsToTags.map((t) => t.tagId),
    pieces: a.arrangementPieces.map(({ orderIndex: pieceOrder, piece }) => ({
      id: piece.id,
      title: piece.title,
      composer: piece.composer,
      copyrightAmountUsd: piece.copyrightAmountUsd,
      licensingStatus: piece.licensingStatus,
      orderIndex: pieceOrder,
    })),
  };
}

/** The relations toEditableArrangement reads: tag ids and pieces in order. */
const partLinks = () => ({
  arrangementsToTags: { columns: { tagId: true as const } },
  arrangementPieces: {
    columns: { orderIndex: true as const },
    orderBy: [asc(arrangementPieces.orderIndex)],
    with: { piece: true as const },
  },
});

const piecePicker = () =>
  db.select({ id: pieces.id, title: pieces.title, composer: pieces.composer }).from(pieces).orderBy(asc(pieces.title), asc(pieces.id));

export type ArrangementForEdit = {
  arrangement: EditableArrangement;
  /** The show that uses the part, if any: such parts are edited in the show editor. */
  showSlug: string | null;
  allTags: AdminTagRow[];
  allPieces: PieceSummary[];
};

/** One part with the tag and piece pickers, for the standalone part page. Null when no part has that id. */
export async function getArrangementForEdit(id: number): Promise<ArrangementForEdit | null> {
  const row = await db.query.arrangements.findFirst({
    where: eq(arrangements.id, id),
    with: { ...partLinks(), showArrangements: { columns: {}, limit: 1, with: { show: { columns: { slug: true } } } } },
  });
  if (!row) return null;
  return {
    arrangement: toEditableArrangement(row, 0),
    showSlug: row.showArrangements[0]?.show?.slug ?? null,
    ...(await getPartPickers()),
  };
}

/** The tag and piece pickers alone, for the new-part page. */
export async function getPartPickers(): Promise<Pick<ArrangementForEdit, 'allTags' | 'allPieces'>> {
  const [allTags, allPieces] = await Promise.all([getTagsForAdmin(), piecePicker()]);
  return { allTags, allPieces };
}

/**
 * The show editor's data, uncached: the show (by id or exact slug, as the
 * admin list links), its parts in order with tags and pieces, every file on
 * the show or its parts, and the tag and piece pickers. Null when no show
 * matches. Every `updatedAt` is an ISO string for the actions' concurrency check.
 */
export async function getShowForEdit(idOrSlug: string): Promise<ShowForEdit | null> {
  const row = await db.query.shows.findFirst({
    where: showWhere(idOrSlug),
    with: {
      showsToTags: { columns: { tagId: true } },
      showArrangements: {
        columns: { orderIndex: true },
        orderBy: [asc(showArrangements.orderIndex)],
        with: {
          arrangement: { with: partLinks() },
        },
      },
    },
  });
  if (!row) return null;

  const arrangementsList: EditableArrangement[] = row.showArrangements
    .filter((link) => Boolean(link.arrangement))
    .map(({ orderIndex, arrangement }) => toEditableArrangement(arrangement, orderIndex));

  const arrangementIds = arrangementsList.map((a) => a.id);
  const [fileRows, allTags, pieceRows] = await Promise.all([
    db
      .select()
      .from(files)
      .where(arrangementIds.length > 0 ? or(eq(files.showId, row.id), inArray(files.arrangementId, arrangementIds)) : eq(files.showId, row.id)),
    getTagsForAdmin(),
    piecePicker(),
  ]);

  return {
    show: {
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      year: row.year,
      difficulty: row.difficulty,
      duration: row.duration,
      programNotes: row.programNotes,
      ensembleSize: row.ensembleSize,
      includes: row.includes,
      thumbnailUrl: row.thumbnailUrl,
      videoUrl: row.videoUrl,
      youtubeUrl: row.youtubeUrl,
      featured: row.featured,
      displayOrder: row.displayOrder,
      commissioned: row.commissioned,
      programCoordinator: row.programCoordinator,
      percussionArranger: row.percussionArranger,
      soundDesigner: row.soundDesigner,
      windArranger: row.windArranger,
      drillWriter: row.drillWriter,
      updatedAt: toIso(row.updatedAt) ?? '',
      tagIds: row.showsToTags.map((t) => t.tagId),
    },
    arrangements: arrangementsList,
    files: fileRows.map((f) => ({ ...f, createdAt: toIso(f.createdAt) ?? '', updatedAt: toIso(f.updatedAt) ?? '' })),
    allTags,
    allPieces: pieceRows,
  };
}
