import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export const donationsTable = pgTable(
  "donations",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id"),
    donorName: text("donor_name").notNull(),
    donorEmail: text("donor_email"),
    message: text("message"),
    amount: integer("amount").notNull(),
    currency: text("currency").notNull().default("IDR"),
    isRecurring: boolean("is_recurring").notNull().default(false),
    method: text("method").notNull().default("manual"),
    status: text("status").notNull().default("pending"),
    gatewayProvider: text("gateway_provider"),
    gatewayReference: text("gateway_reference"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("donations_status_idx").on(t.status),
    index("donations_created_idx").on(t.createdAt),
  ],
);

export const donationTransactionsTable = pgTable("donation_transactions", {
  id: serial("id").primaryKey(),
  donationId: integer("donation_id")
    .notNull()
    .references(() => donationsTable.id, { onDelete: "cascade" }),
  event: text("event").notNull(),
  payload: text("payload"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Donation = typeof donationsTable.$inferSelect;
export type InsertDonation = typeof donationsTable.$inferInsert;
export type DonationTransaction = typeof donationTransactionsTable.$inferSelect;
export type InsertDonationTransaction =
  typeof donationTransactionsTable.$inferInsert;
