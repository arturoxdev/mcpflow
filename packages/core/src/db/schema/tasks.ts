import { pgTable, text, varchar, integer, pgEnum } from 'drizzle-orm/pg-core';
import { boards } from './boards';

export const priorityEnum = pgEnum('priority', ['low', 'medium', 'high']);
export const statusEnum = pgEnum('status', ['todo', 'doing', 'done']);
export const sourceEnum = pgEnum('source', ['internal', 'external']);

export const tasks = pgTable('tasks', {
  id: varchar('id', { length: 26 }).primaryKey(),
  userId: varchar('user_id', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull().default(''),
  priority: priorityEnum('priority').notNull().default('medium'),
  status: statusEnum('status').notNull().default('todo'),
  source: sourceEnum('source').notNull().default('internal'),
  createdBy: varchar('created_by', { length: 50 }),
  boardId: varchar('board_id', { length: 26 })
    .notNull()
    .references(() => boards.id, { onDelete: 'cascade' }),
  pr: integer('pr').notNull(),
});

export type TaskRow = typeof tasks.$inferSelect;
export type NewTaskRow = typeof tasks.$inferInsert;
