import { Router, type IRouter } from "express";
import { and, eq, ilike, or, desc, ne, count, sql } from "drizzle-orm";
import {
  db,
  prayersTable,
  categoriesTable,
  bookmarksTable,
} from "@workspace/db";
import { ListPrayersQueryParams, GetPrayerParams } from "@workspace/api-zod";
import { ensureUser } from "../lib/auth";

const router: IRouter = Router();

function shapePrayer(p: any, bookmarked = false) {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    summary: p.summary,
    body: p.body,
    group: p.group,
    categoryId: p.categoryId,
    categorySlug: p.categorySlug ?? null,
    categoryName: p.categoryName ?? null,
    author: p.author,
    readingMinutes: p.readingMinutes,
    bookmarked,
    createdAt: (p.createdAt instanceof Date
      ? p.createdAt
      : new Date(p.createdAt)
    ).toISOString(),
  };
}

router.get("/prayers", async (req, res): Promise<void> => {
  const parsed = ListPrayersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { q, categorySlug, group, limit, offset } = parsed.data;

  const conditions = [];
  if (group) conditions.push(eq(prayersTable.group, group));
  if (categorySlug)
    conditions.push(eq(categoriesTable.slug, categorySlug));
  if (q && q.trim().length > 0) {
    const pat = `%${q.trim()}%`;
    conditions.push(
      or(
        ilike(prayersTable.title, pat),
        ilike(prayersTable.summary, pat),
        ilike(prayersTable.body, pat),
      )!,
    );
  }
  const whereClause = conditions.length ? and(...conditions) : undefined;

  const rows = await db
    .select({
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
    })
    .from(prayersTable)
    .leftJoin(categoriesTable, eq(prayersTable.categoryId, categoriesTable.id))
    .where(whereClause)
    .orderBy(desc(prayersTable.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(prayersTable)
    .leftJoin(categoriesTable, eq(prayersTable.categoryId, categoriesTable.id))
    .where(whereClause);

  const user = await ensureUser(req);
  let bookmarkedSet = new Set<number>();
  if (user) {
    const bs = await db
      .select({ prayerId: bookmarksTable.prayerId })
      .from(bookmarksTable)
      .where(eq(bookmarksTable.userId, user.id));
    bookmarkedSet = new Set(bs.map((b) => b.prayerId));
  }

  res.json({
    items: rows.map((r) => shapePrayer(r, bookmarkedSet.has(r.id))),
    total,
  });
});

router.get("/prayers/:slug", async (req, res): Promise<void> => {
  const parsed = GetPrayerParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .select({
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
    })
    .from(prayersTable)
    .leftJoin(categoriesTable, eq(prayersTable.categoryId, categoriesTable.id))
    .where(eq(prayersTable.slug, parsed.data.slug));

  if (!row) {
    res.status(404).json({ error: "Prayer not found" });
    return;
  }

  const related = await db
    .select({
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
    })
    .from(prayersTable)
    .leftJoin(categoriesTable, eq(prayersTable.categoryId, categoriesTable.id))
    .where(
      and(eq(prayersTable.group, row.group), ne(prayersTable.id, row.id)),
    )
    .orderBy(sql`random()`)
    .limit(3);

  const user = await ensureUser(req);
  let bookmarked = false;
  let bookmarkedSet = new Set<number>();
  if (user) {
    const bs = await db
      .select({ prayerId: bookmarksTable.prayerId })
      .from(bookmarksTable)
      .where(eq(bookmarksTable.userId, user.id));
    bookmarkedSet = new Set(bs.map((b) => b.prayerId));
    bookmarked = bookmarkedSet.has(row.id);
  }

  res.json({
    ...shapePrayer(row, bookmarked),
    related: related.map((r) => shapePrayer(r, bookmarkedSet.has(r.id))),
  });
});

export default router;
