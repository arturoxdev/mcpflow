import { pgTable, varchar, date, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

export const sprints = pgTable(
  'sprints',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    userId: varchar('user_id', { length: 50 }).notNull(),
    startDate: date('start_date').notNull(),
    name: varchar('name', { length: 120 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex('sprints_user_id_start_date_unique').on(table.userId, table.startDate)]
);

export type SprintRow = typeof sprints.$inferSelect;
export type NewSprintRow = typeof sprints.$inferInsert;
