import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const notes = pgTable('notes', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  dateAt: timestamp('date_at', { withTimezone: true }),
});
