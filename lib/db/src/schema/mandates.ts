import {
  pgTable,
  serial,
  integer,
  text,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { usersTable } from "./auth";
import { listingsTable } from "./listings";

export const mandatesTable = pgTable("mandates", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id")
    .notNull()
    .references(() => listingsTable.id, { onDelete: "cascade" }),
  agentId: text("agent_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  exclusive: boolean("exclusive").notNull().default(false),
  status: text("status").notNull().default("pending"), // 'pending' | 'approved' | 'rejected'
  justificationUrl: text("justification_url"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Mandate = typeof mandatesTable.$inferSelect;
