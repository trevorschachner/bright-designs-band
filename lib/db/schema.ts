import { pgTable, serial, text, integer, numeric, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const difficultyEnum = pgEnum('difficulty', ['Beginner', 'Intermediate', 'Advanced']);

export const shows = pgTable('shows', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  year: text('year'),
  difficulty: difficultyEnum('difficulty'),
  duration: text('duration'),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }),
  thumbnailUrl: text('thumbnail_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const arrangements = pgTable('arrangements', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  type: text('type'),
  price: numeric('price', { precision: 10, scale: 2 }),
  showId: integer('show_id').references(() => shows.id, { onDelete: 'cascade' }).notNull(),
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
}));

export const arrangementsRelations = relations(arrangements, ({ one }) => ({
  show: one(shows, {
    fields: [arrangements.showId],
    references: [shows.id],
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