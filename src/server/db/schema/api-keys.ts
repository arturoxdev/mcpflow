import { pgTable, timestamp, varchar, uniqueIndex } from 'drizzle-orm/pg-core';

export const apiKeys = pgTable(
  'api_keys',
  {
    id: varchar('id', { length: 26 }).primaryKey(),
    userId: varchar('user_id', { length: 50 }).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    prefix: varchar('prefix', { length: 16 }).notNull(),
    hashedKey: varchar('hashed_key', { length: 64 }).notNull(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    hashedKeyIdx: uniqueIndex('api_keys_hashed_key_idx').on(t.hashedKey),
  })
);

export type ApiKeyRow = typeof apiKeys.$inferSelect;
export type NewApiKeyRow = typeof apiKeys.$inferInsert;
