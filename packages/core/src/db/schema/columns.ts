import { pgTable, varchar, integer, timestamp } from 'drizzle-orm/pg-core';

export const columns = pgTable('columns', {
  id: varchar('id', { length: 26 }).primaryKey(),
  userId: varchar('user_id', { length: 50 }).notNull(),
  name: varchar('name', { length: 50 }).notNull(),
  color: varchar('color', { length: 32 }).notNull().default('bg-muted'),
  position: integer('position').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type ColumnRow = typeof columns.$inferSelect;
export type NewColumnRow = typeof columns.$inferInsert;
