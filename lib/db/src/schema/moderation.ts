import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const moderationLogsTable = pgTable("moderation_logs", {
  id: serial("id").primaryKey(),
  moderatorId: text("moderator_id").notNull(),
  targetType: text("target_type").notNull(),
  targetId: integer("target_id").notNull(),
  decision: text("decision").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ModerationLog = typeof moderationLogsTable.$inferSelect;
export type InsertModerationLog = typeof moderationLogsTable.$inferInsert;
