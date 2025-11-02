import { pgTable, serial, text, integer, numeric, timestamp, pgEnum, boolean, primaryKey, index, smallint } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const gradeBandEnum = pgEnum('grade_band', ['1_2', '3_4', '5_plus']);
export const showDifficultyEnum = pgEnum('difficulty', ['Beginner', 'Intermediate', 'Advanced']);
export const ensembleSizeEnum = pgEnum('ensemble_size', ['small', 'medium', 'large']);
export const fileTypeEnum = pgEnum('file_type', ['image', 'audio', 'youtube', 'pdf', 'score', 'other']);
export const arrangementSceneEnum = pgEnum('arrangement_scene', ['Opener', 'Ballad', 'Closer']);

// Shows
export const shows = pgTable('shows', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  lengthSeconds: integer('length_seconds'),
  difficulty: showDifficultyEnum('difficulty'),
  graphicUrl: text('graphic_url'),
  youtubeUrl: text('youtube_url'),
  year: smallint('year'),
  commissioned: text('commissioned'),
  programCoordinator: text('program_coordinator'),
  percussionArranger: text('percussion_arranger'),
  soundDesigner: text('sound_designer'),
  windArranger: text('wind_arranger'),
  drillWriter: text('drill_writer'),
  // Legacy fields retained for backward compatibility/search; consider deprecating
  title: text('title'),
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
  grade: gradeBandEnum('grade'),
  year: smallint('year'),
  durationSeconds: integer('duration_seconds'),
  description: text('description'),
  percussionArranger: text('percussion_arranger'),
  copyrightAmountUsd: numeric('copyright_amount_usd', { precision: 10, scale: 2 }),
  ensembleSize: ensembleSizeEnum('ensemble_size'),
  scene: arrangementSceneEnum('scene'),
  youtubeUrl: text('youtube_url'),
  commissioned: text('commissioned'),
  sampleScoreUrl: text('sample_score_url'),
  // Legacy fields retained temporarily
  title: text('title'),
  type: text('type'),
  displayOrder: integer('display_order').default(0).notNull(),
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
});

export const showsToTags = pgTable('shows_to_tags', {
  showId: integer('show_id').references(() => shows.id, { onDelete: 'cascade' }).notNull(),
  tagId: integer('tag_id').references(() => tags.id, { onDelete: 'cascade' }).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.showId, table.tagId] }),
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

// Relations

export const showsRelations = relations(shows, ({ many }) => ({
  showsToTags: many(showsToTags),
  files: many(files),
  showArrangements: many(showArrangements),
}));

export const arrangementsRelations = relations(arrangements, ({ many }) => ({
  files: many(files),
  showArrangements: many(showArrangements),
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