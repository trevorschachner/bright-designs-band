import { pgTable, serial, text, integer, numeric, timestamp, pgEnum, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const difficultyEnum = pgEnum('difficulty', ['Beginner', 'Intermediate', 'Advanced']);
export const fileTypeEnum = pgEnum('file_type', ['image', 'audio', 'youtube', 'pdf', 'score', 'other']);

export const shows = pgTable('shows', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  year: text('year'),
  difficulty: difficultyEnum('difficulty'),
  duration: text('duration'),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }),
  thumbnailUrl: text('thumbnail_url'),
  composer: text('composer'), // For enhanced search capabilities
  songTitle: text('song_title'), // Original song title for search
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const arrangements = pgTable('arrangements', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  type: text('type'),
  price: numeric('price', { precision: 10, scale: 2 }),
  showId: integer('show_id').references(() => shows.id, { onDelete: 'cascade' }).notNull(),
});

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
});

export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
});

export const showsToTags = pgTable('shows_to_tags', {
  showId: integer('show_id').references(() => shows.id, { onDelete: 'cascade' }).notNull(),
  tagId: integer('tag_id').references(() => tags.id, { onDelete: 'cascade' }).notNull(),
});

// Relations

export const showsRelations = relations(shows, ({ many }) => ({
  arrangements: many(arrangements),
  showsToTags: many(showsToTags),
  files: many(files),
}));

export const arrangementsRelations = relations(arrangements, ({ one, many }) => ({
  show: one(shows, {
    fields: [arrangements.showId],
    references: [shows.id],
  }),
  files: many(files),
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