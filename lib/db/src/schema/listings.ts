import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./auth";

export const listingsTable = pgTable("listings", {
  id: serial("id").primaryKey(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("resale"), // 'resale' | 'new_development'
  title: text("title").notNull(),
  description: text("description"),
  ville: text("ville").notNull(),
  quartier: text("quartier"),
  surface: integer("surface").notNull(),
  nbPieces: integer("nb_pieces").notNull(),
  etage: integer("etage"),
  price: integer("price").notNull(),
  estimatedPrice: integer("estimated_price"),
  investmentScore: integer("investment_score"),
  status: text("status").notNull().default("draft"), // 'draft' | 'published' | 'sold' | 'archived'
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const listingImagesTable = pgTable("listing_images", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id")
    .notNull()
    .references(() => listingsTable.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  position: integer("position").notNull().default(0),
});

export const insertListingSchema = createInsertSchema(listingsTable).omit({
  id: true,
  estimatedPrice: true,
  investmentScore: true,
  createdAt: true,
  updatedAt: true,
});

export const insertListingImageSchema = createInsertSchema(
  listingImagesTable
).omit({ id: true });

export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listingsTable.$inferSelect;
export type ListingImage = typeof listingImagesTable.$inferSelect;
