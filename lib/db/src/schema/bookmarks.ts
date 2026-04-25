import {
  pgTable,
  text,
  integer,
  timestamp,
  primaryKey,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { prayersTable } from "./prayers";

export const bookmarksTable = pgTable(
  "bookmarks",
  {
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    prayerId: integer("prayer_id")
      .notNull()
      .references(() => prayersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.prayerId] })],
);

export type Bookmark = typeof bookmarksTable.$inferSelect;
export type InsertBookmark = typeof bookmarksTable.$inferInsert;
