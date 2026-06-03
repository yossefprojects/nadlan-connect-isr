import {
  pgTable,
  text,
  serial,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const savedReportsTable = pgTable("saved_reports", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(), // 'analysis' | 'chat'
  title: text("title").notNull(),
  listingText: text("listing_text"),
  analysis: jsonb("analysis"),
  chatMarkdown: text("chat_markdown"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type SavedReportRow = typeof savedReportsTable.$inferSelect;
export type InsertSavedReport = typeof savedReportsTable.$inferInsert;
