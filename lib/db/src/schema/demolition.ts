import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./auth";

// Buildings eligible for demolition-reconstruction (Tama 38 / Pinui-Binui),
// registered by owners (or building committees / syndics).
export const demolitionListingsTable = pgTable("demolition_listings", {
  id: serial("id").primaryKey(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  address: text("address").notNull(),
  city: text("city").notNull(),
  units: integer("units").notNull(), // current number of apartments
  buildYear: integer("build_year").notNull(),
  projectType: text("project_type").notNull(), // 'tama38' | 'pinui_binui' | 'both'
  ownerName: text("owner_name").notNull(),
  ownerEmail: text("owner_email").notNull(),
  ownerPhone: text("owner_phone").notNull(),
  status: text("status").notNull().default("pending"), // 'pending' | 'active' | 'closed'
  isPaid: boolean("is_paid").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Uploaded documents for a building (plans, property title, photos).
export const demolitionDocumentsTable = pgTable("demolition_documents", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id")
    .notNull()
    .references(() => demolitionListingsTable.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  name: text("name").notNull(),
  position: integer("position").notNull().default(0),
});

// Offers submitted by promoters (role = developer) on a building.
export const demolitionOffersTable = pgTable("demolition_offers", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id")
    .notNull()
    .references(() => demolitionListingsTable.id, { onDelete: "cascade" }),
  promoterId: text("promoter_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  pricePerUnit: integer("price_per_unit").notNull(), // NIS per current apartment
  newUnitsOffer: integer("new_units_offer").notNull(), // number of new apartments offered
  timeline: text("timeline").notNull(), // estimated project duration
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertDemolitionListingSchema = createInsertSchema(
  demolitionListingsTable,
).omit({
  id: true,
  ownerId: true,
  status: true,
  isPaid: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDemolitionDocumentSchema = createInsertSchema(
  demolitionDocumentsTable,
).omit({ id: true });

export const insertDemolitionOfferSchema = createInsertSchema(
  demolitionOffersTable,
).omit({
  id: true,
  listingId: true,
  promoterId: true,
  createdAt: true,
});

export type InsertDemolitionListing = z.infer<
  typeof insertDemolitionListingSchema
>;
export type DemolitionListing = typeof demolitionListingsTable.$inferSelect;
export type DemolitionDocument = typeof demolitionDocumentsTable.$inferSelect;
export type DemolitionOffer = typeof demolitionOffersTable.$inferSelect;
