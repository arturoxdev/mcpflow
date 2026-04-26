import { boolean, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const boards = pgTable('boards', {
  id: varchar('id', { length: 26 }).primaryKey(),
  userId: varchar('user_id', { length: 50 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull().default(''),
  publicInboxEnabled: boolean('public_inbox_enabled').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type BoardRow = typeof boards.$inferSelect;
export type NewBoardRow = typeof boards.$inferInsert;
