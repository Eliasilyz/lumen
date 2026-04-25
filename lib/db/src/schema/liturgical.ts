import {
  pgTable,
  serial,
  text,
  boolean,
  date,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const liturgicalDaysTable = pgTable(
  "liturgical_days",
  {
    id: serial("id").primaryKey(),
    date: date("date").notNull(),
    season: text("season").notNull(),
    color: text("color").notNull(),
    isFeast: boolean("is_feast").notNull().default(false),
    title: text("title").notNull(),
    saint: text("saint"),
    reflection: text("reflection"),
    recommendedPrayerSlug: text("recommended_prayer_slug"),
  },
  (t) => [uniqueIndex("liturgical_days_date_unique").on(t.date)],
);

export type LiturgicalDay = typeof liturgicalDaysTable.$inferSelect;
export type InsertLiturgicalDay = typeof liturgicalDaysTable.$inferInsert;
