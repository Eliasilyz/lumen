import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { categoriesTable } from "./categories";

export const prayersTable = pgTable(
  "prayers",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    body: text("body").notNull(),
    group: text("group").notNull(),
    categoryId: integer("category_id").references(() => categoriesTable.id, {
      onDelete: "set null",
    }),
    author: text("author"),
    readingMinutes: integer("reading_minutes").notNull().default(2),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("prayers_slug_unique").on(t.slug),
    index("prayers_group_idx").on(t.group),
    index("prayers_category_idx").on(t.categoryId),
  ],
);

export type Prayer = typeof prayersTable.$inferSelect;
export type InsertPrayer = typeof prayersTable.$inferInsert;
