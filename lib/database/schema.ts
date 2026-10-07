import { pgTable, serial, text, integer, numeric, timestamp, pgEnum, boolean, primaryKey, index, smallint, check } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// Enums
export const gradeBandEnum = pgEnum('grade_band', ['1_2', '3_4', '5_plus']);
export const showDifficultyEnum = pgEnum('difficulty', ['Beginner', 'Intermediate', 'Advanced']);
export const ensembleSizeEnum = pgEnum('ensemble_size', ['small', 'medium', 'large']);
export const fileTypeEnum = pgEnum('file_type', ['image', 'audio', 'youtube', 'pdf', 'score', 'other']);
export const arrangementSceneEnum = pgEnum('arrangement_scene', ['Opener', 'Ballad', 'Closer']);

// Shows
export const shows = pgTable('shows', {
  id: serial('id').primaryKey(),
  // title is the canonical show name
  title: text('title').notNull(),
  // Unique in the database via shows_slug_unique_idx. Declared here so
  // drizzle-kit stops proposing to drop it: the constraint previously existed
  // only in hand-written SQL that was never applied, leaving uniqueness to
  // three separate application-level collision loops.
  slug: text('slug').notNull().unique(),
  description: text('description'),
  difficulty: showDifficultyEnum('difficulty'),
  graphicUrl: text('graphic_url'),
  youtubeUrl: text('youtube_url'),
  year: smallint('year'),
  featured: boolean('featured').default(false).notNull(),
  displayOrder: integer('display_order').default(0).notNull(),
  commissioned: text('commissioned'),
  programCoordinator: text('program_coordinator'),
  percussionArranger: text('percussion_arranger'),
  soundDesigner: text('sound_designer'),
  windArranger: text('wind_arranger'),
  drillWriter: text('drill_writer'),
  duration: text('duration'),
  price: numeric('price', { precision: 10, scale: 2 }),
  thumbnailUrl: text('thumbnail_url'),
  videoUrl: text('video_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Arrangements
export const arrangements = pgTable('arrangements', {
  id: serial('id').primaryKey(),
  composer: text('composer'),
  arranger: text('arranger'), // Wind arranger / general arranger
  grade: gradeBandEnum('grade'),
  year: smallint('year'),
  durationSeconds: integer('duration_seconds'),
  description: text('description'),
  percussionArranger: text('percussion_arranger'),
  ensembleSize: ensembleSizeEnum('ensemble_size'),
  scene: arrangementSceneEnum('scene'),
  youtubeUrl: text('youtube_url'),
  commissioned: text('commissioned'),
  sampleScoreUrl: text('sample_score_url'),
  // Marked "legacy" but universally required: every consumer treats title as
  // the display name and interpolates it unguarded. Zero nulls exist, so the
  // constraint matches how the column is actually used.
  title: text('title').notNull(),
  // Written by the arrangements API but never read for ordering — reads use
  // showArrangements.orderIndex. Retained because 50 rows carry real values.
  displayOrder: integer('display_order').default(0).notNull(),
  // Added in drizzle/0003 (existing rows get now()). Writers set it on every
  // update; lib/actions compare it for optimistic concurrency.
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Files (unchanged)
export const files = pgTable('files', {
  id: serial('id').primaryKey(),
  fileName: text('file_name').notNull(),
  originalName: text('original_name').notNull(),
  fileType: fileTypeEnum('file_type').notNull(),
  fileSize: integer('file_size').notNull(), // in bytes
  mimeType: text('mime_type').notNull(),
  url: text('url').notNull(), // Supabase Storage URL
  storagePath: text('storage_path').notNull(), // Path in Supabase Storage
  showId: integer('show_id').references(() => shows.id, { onDelete: 'cascade' }),
  arrangementId: integer('arrangement_id').references(() => arrangements.id, { onDelete: 'cascade' }),
  isPublic: boolean('is_public').default(false).notNull(),
  description: text('description'),
  displayOrder: integer('display_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  showIdIdx: index('files_show_id_idx').on(table.showId),
  arrangementIdIdx: index('files_arrangement_id_idx').on(table.arrangementId),
}));

export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  // Added in drizzle/0003 (existing rows get now()). lib/actions/tags.ts sets
  // it on every update and compares it for optimistic concurrency.
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const showsToTags = pgTable('shows_to_tags', {
  showId: integer('show_id').references(() => shows.id, { onDelete: 'cascade' }).notNull(),
  tagId: integer('tag_id').references(() => tags.id, { onDelete: 'cascade' }).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.showId, table.tagId] }),
}));

export const arrangementsToTags = pgTable('arrangements_to_tags', {
  arrangementId: integer('arrangement_id').references(() => arrangements.id, { onDelete: 'cascade' }).notNull(),
  tagId: integer('tag_id').references(() => tags.id, { onDelete: 'cascade' }).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.arrangementId, table.tagId] }),
}));

// Show ↔ Arrangements (ordered join)
export const showArrangements = pgTable('show_arrangements', {
  showId: integer('show_id').references(() => shows.id, { onDelete: 'cascade' }).notNull(),
  arrangementId: integer('arrangement_id').references(() => arrangements.id, { onDelete: 'cascade' }).notNull(),
  orderIndex: smallint('order_index').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.showId, table.arrangementId] }),
  idxShow: index('show_arrangements_show_idx').on(table.showId),
  idxArrangement: index('show_arrangements_arr_idx').on(table.arrangementId),
}));

// Pieces: the source works a part is built from ("Libertango", composer,
// copyright cost). Distinct from `arrangements`, which are show parts (Part 1–4,
// each with its own audio). One part draws on one or more pieces, and a piece
// can appear in several parts. Mirrors the "Pieces" tab of the Show Database
// sheet. See issue #51.
export const pieces = pgTable('pieces', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  composer: text('composer'),
  copyrightAmountUsd: numeric('copyright_amount_usd', { precision: 10, scale: 2 }),
  // Free text on purpose: the sheet uses values like "NYA" (not yet acquired),
  // "licensed" and "public domain", and the set is not settled yet.
  licensingStatus: text('licensing_status'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Arrangement (part) ↔ Pieces (ordered join)
export const arrangementPieces = pgTable('arrangement_pieces', {
  arrangementId: integer('arrangement_id').references(() => arrangements.id, { onDelete: 'cascade' }).notNull(),
  pieceId: integer('piece_id').references(() => pieces.id, { onDelete: 'cascade' }).notNull(),
  orderIndex: smallint('order_index').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.arrangementId, table.pieceId] }),
  idxArrangement: index('arrangement_pieces_arr_idx').on(table.arrangementId),
  idxPiece: index('arrangement_pieces_piece_idx').on(table.pieceId),
}));

export const resources = pgTable('resources', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  fileUrl: text('file_url'),
  imageUrl: text('image_url'),
  isActive: boolean('is_active').default(true).notNull(),
  requiresContactForm: boolean('requires_contact_form').default(true).notNull(),
  downloadCount: integer('download_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Old show slugs. When a show's slug changes, lib/actions/shows.ts records the
// previous one here so /shows/<old> 308s to the current URL
// (getSlugRedirect in lib/services/shows.ts). A slug that a show claims again
// has its row deleted, so a live slug never also redirects. Table from
// drizzle/0003; RLS policies in drizzle/migrations/2026-10-08_slug_redirects_rls.sql.
export const slugRedirects = pgTable('slug_redirects', {
  oldSlug: text('old_slug').primaryKey(),
  showId: integer('show_id').references(() => shows.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('slug_redirects_show_id_idx').on(table.showId),
]);

// Relations

export const showsRelations = relations(shows, ({ many }) => ({
  showsToTags: many(showsToTags),
  files: many(files),
  showArrangements: many(showArrangements),
}));

export const arrangementsRelations = relations(arrangements, ({ many }) => ({
  files: many(files),
  showArrangements: many(showArrangements),
  arrangementsToTags: many(arrangementsToTags),
  arrangementPieces: many(arrangementPieces),
}));

export const piecesRelations = relations(pieces, ({ many }) => ({
  arrangementPieces: many(arrangementPieces),
}));

export const arrangementPiecesRelations = relations(arrangementPieces, ({ one }) => ({
  arrangement: one(arrangements, {
    fields: [arrangementPieces.arrangementId],
    references: [arrangements.id],
  }),
  piece: one(pieces, {
    fields: [arrangementPieces.pieceId],
    references: [pieces.id],
  }),
}));

export const filesRelations = relations(files, ({ one }) => ({
  show: one(shows, {
    fields: [files.showId],
    references: [shows.id],
  }),
  arrangement: one(arrangements, {
    fields: [files.arrangementId],
    references: [arrangements.id],
  }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  showsToTags: many(showsToTags),
  arrangementsToTags: many(arrangementsToTags),
}));

export const showsToTagsRelations = relations(showsToTags, ({ one }) => ({
  show: one(shows, {
    fields: [showsToTags.showId],
    references: [shows.id],
  }),
  tag: one(tags, {
    fields: [showsToTags.tagId],
    references: [tags.id],
  }),
}));

export const arrangementsToTagsRelations = relations(arrangementsToTags, ({ one }) => ({
  arrangement: one(arrangements, {
    fields: [arrangementsToTags.arrangementId],
    references: [arrangements.id],
  }),
  tag: one(tags, {
    fields: [arrangementsToTags.tagId],
    references: [tags.id],
  }),
}));

export const showArrangementsRelations = relations(showArrangements, ({ one }) => ({
  show: one(shows, {
    fields: [showArrangements.showId],
    references: [shows.id],
  }),
  arrangement: one(arrangements, {
    fields: [showArrangements.arrangementId],
    references: [arrangements.id],
  }),
}));

// Contact form submissions table
export const contactSubmissions = pgTable('contact_submissions', {
  id: serial('id').primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  service: text('service').notNull(), // existing-show, choreography, etc.
  message: text('message').notNull(),
  source: text('source').notNull().default('contact'),
  privacyAgreed: boolean('privacy_agreed').notNull().default(false),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  emailSent: boolean('email_sent').notNull().default(false),
  emailSentAt: timestamp('email_sent_at'),
  emailError: text('email_error'),
  status: text('status').notNull().default('new'), // new, contacted, resolved, spam
  adminNotes: text('admin_notes'),
  interestedShowId: integer('interested_show_id').references(() => shows.id, { onDelete: 'set null' }),
  interestedArrangementId: integer('interested_arrangement_id').references(() => arrangements.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Per-IP counters for the public contact form (lib/rate-limit.ts). RLS is on
// with no policies; only the server writes it, over DATABASE_URL.
export const contactRateLimits = pgTable('contact_rate_limits', {
  ip: text('ip').notNull(),
  windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
  count: integer('count').notNull().default(0),
}, (table) => ({
  pk: primaryKey({ columns: [table.ip, table.windowStart] }),
}));

// Named admin allowlist. Created by drizzle migration 0002; the seed, the RLS
// helper functions and the policies live in
// drizzle/migrations/2026-10-08_admin_users.sql. A row here is what grants
// admin access: lib/auth/roles.ts getUserRole() reads it per request, and RLS
// policies call public.is_admin_user() over it.
//
// Emails are stored lower-case (enforced by admin_users_email_lower) and every
// lookup compares against lower(<input>), so plain text equality is
// case-insensitive in effect.
export const adminUsers = pgTable('admin_users', {
  email: text('email').primaryKey(),
  role: text('role', { enum: ['owner', 'editor'] }).notNull(),
  addedBy: text('added_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, () => [
  check('admin_users_email_lower', sql`email = lower(email)`),
  check('admin_users_role_check', sql`role in ('owner','editor')`),
]);

export const contactSubmissionsRelations = relations(contactSubmissions, ({ one }) => ({
  interestedShow: one(shows, {
    fields: [contactSubmissions.interestedShowId],
    references: [shows.id],
  }),
  interestedArrangement: one(arrangements, {
    fields: [contactSubmissions.interestedArrangementId],
    references: [arrangements.id],
  }),
})); 