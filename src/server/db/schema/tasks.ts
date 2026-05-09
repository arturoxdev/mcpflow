import { pgTable, text, varchar, integer, pgEnum } from 'drizzle-orm/pg-core';
import { boards } from './boards';
import { columns } from './columns';
import { sprints } from './sprints';

export const priorityEnum = pgEnum('priority', ['low', 'medium', 'high']);
export const sourceEnum = pgEnum('source', ['internal', 'external']);
export const sprintDayEnum = pgEnum('sprint_day', ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
export const effortEnum = pgEnum('effort', ['low', 'high']);

export const tasks = pgTable('tasks', {
  id: varchar('id', { length: 26 }).primaryKey(),
  userId: varchar('user_id', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull().default(''),
  priority: priorityEnum('priority').notNull().default('medium'),
  columnId: varchar('column_id', { length: 26 })
    .notNull()
    .references(() => columns.id, { onDelete: 'restrict' }),
  source: sourceEnum('source').notNull().default('internal'),
  createdBy: varchar('created_by', { length: 50 }),
  boardId: varchar('board_id', { length: 26 })
    .notNull()
    .references(() => boards.id, { onDelete: 'cascade' }),
  pr: integer('pr').notNull(),
  sprintId: varchar('sprint_id', { length: 26 }).references(() => sprints.id, {
    onDelete: 'set null',
  }),
  sprintDay: sprintDayEnum('sprint_day'),
  sprintPosition: integer('sprint_position'),
  effort: effortEnum('effort'),
});

export type TaskRow = typeof tasks.$inferSelect;
export type NewTaskRow = typeof tasks.$inferInsert;
