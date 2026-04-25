import {
  pgTable,
  serial,
  text,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const categoriesTable = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    group: text("group").notNull(),
    description: text("description"),
  },
  (t) => [
    uniqueIndex("categories_slug_unique").on(t.slug),
    index("categories_group_idx").on(t.group),
  ],
);

export type Category = typeof categoriesTable.$inferSelect;
export type InsertCategory = typeof categoriesTable.$inferInsert;
