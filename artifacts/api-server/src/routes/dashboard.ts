import { Router, type IRouter } from "express";
import { and, desc, eq, sum, count, sql } from "drizzle-orm";
import {
  db,
  prayersTable,
  categoriesTable,
  liturgicalDaysTable,
  wallPostsTable,
  donationsTable,
  bookmarksTable,
} from "@workspace/db";
import { ensureUser } from "../lib/auth";

const router: IRouter = Router();

const FUND_GOAL = 50000000;

router.get("/dashboard/today", async (req, res): Promise<void> => {
  const today = new Date().toISOString().slice(0, 10);

  const [todayRow] = await db
    .select({
      date: liturgicalDaysTable.date,
      season: liturgicalDaysTable.season,
      color: liturgicalDaysTable.color,
      isFeast: liturgicalDaysTable.isFeast,
      title: liturgicalDaysTable.title,
      saint: liturgicalDaysTable.saint,
      reflection: liturgicalDaysTable.reflection,
      recommendedPrayerSlug: liturgicalDaysTable.recommendedPrayerSlug,
      recommendedPrayerTitle: prayersTable.title,
    })
    .from(liturgicalDaysTable)
    .leftJoin(
      prayersTable,
      eq(prayersTable.slug, liturgicalDaysTable.recommendedPrayerSlug),
    )
    .where(eq(liturgicalDaysTable.date, today));

  const liturgicalDay = todayRow
    ? {
        date:
          typeof todayRow.date === "string"
            ? todayRow.date
            : new Date(todayRow.date).toISOString().slice(0, 10),
        season: todayRow.season,
        color: todayRow.color,
        isFeast: todayRow.isFeast,
        title: todayRow.title,
        saint: todayRow.saint,
        reflection: todayRow.reflection,
        recommendedPrayerSlug: todayRow.recommendedPrayerSlug,
        recommendedPrayerTitle: todayRow.recommendedPrayerTitle,
      }
    : {
        date: today,
        season: "ordinary",
        color: "green",
        isFeast: false,
        title: "Ordinary Time",
        saint: null,
        reflection: null,
        recommendedPrayerSlug: null,
        recommendedPrayerTitle: null,
      };

  const baseSelect = {
    id: prayersTable.id,
    slug: prayersTable.slug,
    title: prayersTable.title,
    summary: prayersTable.summary,
    body: prayersTable.body,
    group: prayersTable.group,
    categoryId: prayersTable.categoryId,
    categorySlug: categoriesTable.slug,
    categoryName: categoriesTable.name,
    author: prayersTable.author,
    readingMinutes: prayersTable.readingMinutes,
    createdAt: prayersTable.createdAt,
  };

  let recommended: any = null;
  if (liturgicalDay.recommendedPrayerSlug) {
    const [r] = await db
      .select(baseSelect)
      .from(prayersTable)
      .leftJoin(
        categoriesTable,
        eq(prayersTable.categoryId, categoriesTable.id),
      )
      .where(eq(prayersTable.slug, liturgicalDay.recommendedPrayerSlug));
    recommended = r ?? null;
  }
  if (!recommended) {
    const [r] = await db
      .select(baseSelect)
      .from(prayersTable)
      .leftJoin(
        categoriesTable,
        eq(prayersTable.categoryId, categoriesTable.id),
      )
      .orderBy(desc(prayersTable.createdAt))
      .limit(1);
    recommended = r;
  }

  const featured = await db
    .select(baseSelect)
    .from(prayersTable)
    .leftJoin(categoriesTable, eq(prayersTable.categoryId, categoriesTable.id))
    .orderBy(sql`random()`)
    .limit(6);

  const user = await ensureUser(req);
  let bookmarkedSet = new Set<number>();
  if (user) {
    const bs = await db
      .select({ prayerId: bookmarksTable.prayerId })
      .from(bookmarksTable)
      .where(eq(bookmarksTable.userId, user.id));
    bookmarkedSet = new Set(bs.map((b) => b.prayerId));
  }

  const shape = (p: any) =>
    p
      ? {
          id: p.id,
          slug: p.slug,
          title: p.title,
          summary: p.summary,
          body: p.body,
          group: p.group,
          categoryId: p.categoryId,
          categorySlug: p.categorySlug,
          categoryName: p.categoryName,
          author: p.author,
          readingMinutes: p.readingMinutes,
          bookmarked: bookmarkedSet.has(p.id),
          createdAt: (p.createdAt instanceof Date
            ? p.createdAt
            : new Date(p.createdAt)
          ).toISOString(),
        }
      : null;

  const recentWall = await db
    .select()
    .from(wallPostsTable)
    .where(eq(wallPostsTable.status, "approved"))
    .orderBy(desc(wallPostsTable.createdAt))
    .limit(4);

  const [{ total: raisedRaw, donors }] = await db
    .select({
      total: sum(donationsTable.amount),
      donors: count(),
    })
    .from(donationsTable)
    .where(eq(donationsTable.status, "paid"));

  const recentDonors = await db
    .select({
      donorName: donationsTable.donorName,
      amount: donationsTable.amount,
      currency: donationsTable.currency,
      message: donationsTable.message,
      createdAt: donationsTable.createdAt,
    })
    .from(donationsTable)
    .where(eq(donationsTable.status, "paid"))
    .orderBy(desc(donationsTable.createdAt))
    .limit(5);

  res.json({
    today: liturgicalDay,
    recommendedPrayer: shape(recommended),
    featuredPrayers: featured.map(shape).filter(Boolean),
    recentWallPosts: recentWall.map((p) => ({
      id: p.id,
      displayName: p.anonymous ? "Anonymous" : p.displayName,
      message: p.message,
      category: p.category,
      prayCount: p.prayCount,
      status: p.status,
      createdAt: (p.createdAt instanceof Date
        ? p.createdAt
        : new Date(p.createdAt)
      ).toISOString(),
    })),
    transparency: {
      goalAmount: FUND_GOAL,
      raisedAmount: Number(raisedRaw ?? 0),
      currency: "IDR",
      donorCount: Number(donors ?? 0),
      recentDonors: recentDonors.map((d) => ({
        donorName: d.donorName,
        amount: d.amount,
        currency: d.currency,
        message: d.message,
        createdAt: (d.createdAt instanceof Date
          ? d.createdAt
          : new Date(d.createdAt)
        ).toISOString(),
      })),
      allocations: [
        {
          label: "Platform & content",
          percent: 60,
          description:
            "Hosting, security, prayer-content editorial, and translation work.",
        },
        {
          label: "Outreach & catechesis",
          percent: 25,
          description:
            "Free retreats, parish-partner programs, and printed prayer cards.",
        },
        {
          label: "Charity to those in need",
          percent: 15,
          description:
            "Direct support to families flagged through the Wall of Hope.",
        },
      ],
    },
  });
});

export default router;
