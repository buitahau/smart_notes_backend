import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const settings = pgTable(
  'settings',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    receiveReminder: boolean('receive_reminder').notNull().default(true),
    intervalMinutes: integer('interval_minutes').notNull().default(60),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => ({
    userUniqueIdx: uniqueIndex('settings_user_id_idx').on(table.userId),
  })
);
