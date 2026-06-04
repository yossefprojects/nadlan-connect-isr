import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { usersTable } from "./auth";
import { programsTable } from "./programs";
import { listingsTable } from "./listings";

/**
 * Unified media/document store for promoteur programmes and projets.
 * A document is attached to EITHER a programme (programId) OR a projet
 * (listingId) — never both. Category drives default visibility:
 *   photo, plan        -> public
 *   authorization      -> private (owner + admin only)
 */
export const documentsTable = pgTable("documents", {
  id: serial("id").primaryKey(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  programId: integer("program_id").references(() => programsTable.id, {
    onDelete: "cascade",
  }),
  listingId: integer("listing_id").references(() => listingsTable.id, {
    onDelete: "cascade",
  }),
  category: text("category").notNull(), // 'photo' | 'plan' | 'authorization'
  visibility: text("visibility").notNull().default("public"), // 'public' | 'private'
  objectPath: text("object_path").notNull(),
  fileName: text("file_name"),
  mimeType: text("mime_type"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type DocumentRow = typeof documentsTable.$inferSelect;
