import { Router, type IRouter } from "express";
import { and, eq, gte, lte, asc } from "drizzle-orm";
import { db, liturgicalDaysTable, prayersTable } from "@workspace/db";
import { GetMonthQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

function fmtDay(d: any, recommendedTitle: string | null) {
  return {
    date: typeof d.date === "string" ? d.date : new Date(d.date).toISOString().slice(0, 10),
    season: d.season,
    color: d.color,
    isFeast: d.isFeast,
    title: d.title,
    saint: d.saint,
    reflection: d.reflection,
    recommendedPrayerSlug: d.recommendedPrayerSlug,
    recommendedPrayerTitle: recommendedTitle,
  };
}

router.get("/calendar/today", async (_req, res): Promise<void> => {
  const today = new Date().toISOString().slice(0, 10);
  const [row] = await db
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

  if (row) {
    res.json(fmtDay(row, row.recommendedPrayerTitle));
    return;
  }

  res.json({
    date: today,
    season: "ordinary",
    color: "green",
    isFeast: false,
    title: "Ordinary Time",
    saint: null,
    reflection: null,
    recommendedPrayerSlug: null,
    recommendedPrayerTitle: null,
  });
});

router.get("/calendar/month", async (req, res): Promise<void> => {
  const parsed = GetMonthQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { year, month } = parsed.data;
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const rows = await db
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
    .where(
      and(
        gte(liturgicalDaysTable.date, start),
        lte(liturgicalDaysTable.date, end),
      ),
    )
    .orderBy(asc(liturgicalDaysTable.date));

  res.json(rows.map((r) => fmtDay(r, r.recommendedPrayerTitle)));
});

export default router;
