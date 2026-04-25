import { pgTable, text, boolean, timestamp, index } from "drizzle-orm/pg-core";

export const usersTable = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email"),
    displayName: text("display_name").notNull(),
    isAdmin: boolean("is_admin").notNull().default(false),
    fontScale: text("font_scale").notNull().default("md"),
    theme: text("theme").notNull().default("system"),
    morningReminder: boolean("morning_reminder").notNull().default(false),
    eveningReminder: boolean("evening_reminder").notNull().default(false),
    reminderChannel: text("reminder_channel").notNull().default("none"),
    language: text("language").notNull().default("id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("users_email_idx").on(t.email)],
);

export type User = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;
