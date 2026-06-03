import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

// B2B onboarding applications (promoteur / agence). These are captured for
// manual verification ("vérification sous 24h") and are distinct from the
// Replit-Auth `users` table. Passwords are stored hashed (scrypt).
export const profilesTable = pgTable("profiles", {
  id: serial("id").primaryKey(),
  role: text("role").notNull(), // 'developer' (promoteur) | 'agent' (agence)
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  companyName: text("company_name").notNull(), // nom société / nom agence
  ville: text("ville").notNull(),
  plan: text("plan").notNull(), // 'starter' | 'pro'
  passwordHash: text("password_hash").notNull(),
  status: text("status").notNull().default("pending"), // 'pending' | 'verified' | 'rejected'
  // Promoteur-specific
  nbProgrammes: integer("nb_programmes"),
  website: text("website"),
  // Agence-specific
  licenseNumber: text("license_number"), // Risha'yon
  nbAgents: integer("nb_agents"),
  specialties: jsonb("specialties").$type<string[]>(),
  cguAccepted: boolean("cgu_accepted").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Profile = typeof profilesTable.$inferSelect;
export type InsertProfile = typeof profilesTable.$inferInsert;
