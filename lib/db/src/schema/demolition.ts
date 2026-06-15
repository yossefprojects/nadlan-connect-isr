import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  doublePrecision,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./auth";

// Buildings eligible for demolition-reconstruction (Tama 38 / Pinui-Binui),
// registered by owners (or building committees / syndics).
//
// ADDRESS CONFIDENTIALITY: the exact `address` and precise coordinates (`lat`,
// `lng`) are PRIVATE. They are never exposed to promoters before an official
// connection (see demolition_connections) has been validated. Public views only
// expose `neighborhood` and the fuzzed center (`approxLat`/`approxLng`) used to
// draw an approximate circle on the map.
export const demolitionListingsTable = pgTable("demolition_listings", {
  id: serial("id").primaryKey(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  address: text("address").notNull(),
  city: text("city").notNull(),
  neighborhood: text("neighborhood"), // general quarter shown publicly (e.g. "Florentin")
  // Exact coordinates (geocoded from address) — PRIVATE, revealed-only.
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  // Fuzzed center used to draw the public approximate-location circle.
  approxLat: doublePrecision("approx_lat"),
  approxLng: doublePrecision("approx_lng"),
  units: integer("units").notNull(), // current number of apartments
  buildYear: integer("build_year").notNull(),
  projectType: text("project_type").notNull(), // 'tama38' | 'pinui_binui' | 'both'
  ownerName: text("owner_name").notNull(),
  ownerEmail: text("owner_email").notNull(),
  ownerPhone: text("owner_phone").notNull(),
  // 'pending' (awaiting admin moderation) | 'active' (open to offers) |
  // 'offer_locked' (owner accepted an offer — no more offers) | 'closed'
  status: text("status").notNull().default("pending"),
  // Winning offer once the owner accepts; set together with status='offer_locked'.
  acceptedOfferId: integer("accepted_offer_id"),
  // Resale mandate: once a listing is 'offer_locked', the winning promoter (the
  // promoter of the accepted offer) can mandate a licensed agence to handle the
  // resale of the acquired project. resaleAgentId references the agence's user id
  // (usersTable, role='agent'); resaleStatus is null until a mandate is given.
  resaleAgentId: text("resale_agent_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  resaleStatus: text("resale_status"), // null | 'mandated'
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
// An offer is far more than a price: it captures financial terms, the quality of
// the delivered building, timeline/security guarantees, and the promoter's track
// record. A weighted comparison score is computed server-side at read time.
export const demolitionOffersTable = pgTable("demolition_offers", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id")
    .notNull()
    .references(() => demolitionListingsTable.id, { onDelete: "cascade" }),
  promoterId: text("promoter_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),

  // Lifecycle within the listing's open-bidding flow. All offers start 'pending';
  // when the owner accepts one it becomes 'accepted' and every other offer on the
  // same listing is set to 'rejected'.
  status: text("status").notNull().default("pending"), // 'pending' | 'accepted' | 'rejected'

  // --- Financial ---
  pricePerUnit: integer("price_per_unit").notNull(), // NIS per current apartment
  newUnitArea: integer("new_unit_area").notNull().default(0), // m² of the new apartment offered
  newUnitsOffer: integer("new_units_offer").notNull(), // extra apartments offered to owners
  estimatedDeliveredValue: integer("estimated_delivered_value")
    .notNull()
    .default(0), // NIS estimated value of the delivered apartment

  // --- Qualitative ---
  standing: text("standing").notNull().default("standard"), // 'standard' | 'high_end' | 'luxury'
  materials: text("materials"), // free text: materials & finishes
  floors: integer("floors").notNull().default(0), // number of floors of the new building
  parkingPerUnit: integer("parking_per_unit").notNull().default(0), // parking spots per apartment
  elevator: boolean("elevator").notNull().default(false),
  bikeStorage: boolean("bike_storage").notNull().default(false),
  gym: boolean("gym").notNull().default(false),
  lobby: boolean("lobby").notNull().default(false),
  replacementHousing: boolean("replacement_housing").notNull().default(false), // housing during works
  replacementHousingQuality: text("replacement_housing_quality"), // free text quality note

  // --- Timeline & security ---
  constructionDurationMonths: integer("construction_duration_months")
    .notNull()
    .default(0),
  startDelayMonths: integer("start_delay_months").notNull().default(0),
  bankGuarantee: boolean("bank_guarantee").notNull().default(false),
  projectReferences: text("project_references"), // names / links to past projects

  // Deprecated: superseded by constructionDurationMonths/startDelayMonths.
  // Kept nullable for backward compatibility; no longer part of the API contract.
  timeline: text("timeline"),
  message: text("message"), // optional free note to the owner
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Official "mise en relation" between an owner and a chosen promoter.
// The owner selects a promoter (via their offer); NadlanConnect (admin) validates
// the connection; only then is the building's exact address revealed to that
// promoter and the introduction commission marked as due.
export const demolitionConnectionsTable = pgTable(
  "demolition_connections",
  {
    id: serial("id").primaryKey(),
    listingId: integer("listing_id")
      .notNull()
      .references(() => demolitionListingsTable.id, { onDelete: "cascade" }),
    promoterId: text("promoter_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    offerId: integer("offer_id").references(() => demolitionOffersTable.id, {
      onDelete: "set null",
    }),
    // 'requested' (owner chose, awaiting admin) | 'validated' (address revealed) | 'rejected'
    status: text("status").notNull().default("requested"),
    // 'none' | 'due' (set when validated) | 'paid'
    commissionStatus: text("commission_status").notNull().default("none"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    validatedAt: timestamp("validated_at", { withTimezone: true }),
  },
  (table) => [unique().on(table.listingId, table.promoterId)],
);

export const insertDemolitionListingSchema = createInsertSchema(
  demolitionListingsTable,
).omit({
  id: true,
  ownerId: true,
  status: true,
  acceptedOfferId: true,
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
  status: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDemolitionConnectionSchema = createInsertSchema(
  demolitionConnectionsTable,
).omit({
  id: true,
  status: true,
  commissionStatus: true,
  createdAt: true,
  validatedAt: true,
});

export type InsertDemolitionListing = z.infer<
  typeof insertDemolitionListingSchema
>;
export type DemolitionListing = typeof demolitionListingsTable.$inferSelect;
export type DemolitionDocument = typeof demolitionDocumentsTable.$inferSelect;
export type DemolitionOffer = typeof demolitionOffersTable.$inferSelect;
export type DemolitionConnection =
  typeof demolitionConnectionsTable.$inferSelect;
