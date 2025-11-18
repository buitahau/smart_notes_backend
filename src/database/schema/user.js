import { pgTable, text, timestamp, uniqueIndex, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    firstName: text('first_name').notNull().default(''),
    lastName: text('last_name').notNull().default(''),
    email: text('email').notNull(),
    status: boolean('status').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  table => ({
    userEmailIdx: uniqueIndex('users_email_idx').on(table.email),
  })
);
