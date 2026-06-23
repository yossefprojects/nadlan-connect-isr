import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

// Online subscriptions paid via PayPlus (card / Apple Pay / Google Pay).
// One row is created per checkout attempt; it moves pending -> active once the
// PayPlus IPN callback confirms payment, and recurring re-charges keep it active.
export const subscriptionsTable = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  // Unambiguous plan key, e.g. 'agent_mensuel' | 'introducer_annuel'.
  plan: text("plan").notNull(),
  amount: integer("amount").notNull(), // NIS (per month or per year, depending on the plan)
  currency: text("currency").notNull().default("ILS"),
  // 'pending' | 'active' | 'cancelled' | 'expired' | 'failed'
  status: text("status").notNull().default("pending"),
  // PayPlus references.
  pageRequestUid: text("page_request_uid"), // returned by generateLink
  transactionUid: text("transaction_uid"), // from the paid IPN callback
  recurringUid: text("recurring_uid"), // recurring subscription id (used to cancel)
  token: text("token"), // saved card token (manual re-charge fallback)
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Subscription = typeof subscriptionsTable.$inferSelect;
