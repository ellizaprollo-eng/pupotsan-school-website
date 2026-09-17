import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const schoolContent = sqliteTable('school_content', {
  id:text('id').primaryKey(), content:text('content').notNull(),
  revision:integer('revision').notNull().default(1), updatedBy:text('updated_by').notNull(), updatedAt:text('updated_at').notNull()
});
