import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export const wallPostsTable = pgTable(
  "wall_posts",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id"),
    displayName: text("display_name").notNull(),
    anonymous: boolean("anonymous").notNull().default(true),
    message: text("message").notNull(),
    category: text("category").notNull(),
    prayCount: integer("pray_count").notNull().default(0),
    status: text("status").notNull().default("pending"),
    submitterIp: text("submitter_ip"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("wall_status_idx").on(t.status),
    index("wall_category_idx").on(t.category),
    index("wall_created_idx").on(t.createdAt),
  ],
);

export type WallPost = typeof wallPostsTable.$inferSelect;
export type InsertWallPost = typeof wallPostsTable.$inferInsert;
