import { Router, type IRouter } from "express";
import { and, desc, eq, sum, count, sql } from "drizzle-orm";
import {
  db,
  prayersTable,
  wallPostsTable,
  donationsTable,
  moderationLogsTable,
} from "@workspace/db";
import {
  AdminCreatePrayerBody,
  AdminUpdatePrayerParams,
  AdminUpdatePrayerBody,
  AdminDeletePrayerParams,
  AdminModerateWallPostParams,
  AdminModerateWallPostBody,
  AdminListDonationsQueryParams,
} from "@workspace/api-zod";
import { requireAdmin, type AuthedRequest } from "../lib/auth";

const router: IRouter = Router();

router.use("/admin", requireAdmin);

router.get("/admin/summary", async (_req, res): Promise<void> => {
  const [{ value: prayers }] = await db
    .select({ value: count() })
    .from(prayersTable);
  const [{ value: wallPosts }] = await db
    .select({ value: count() })
    .from(wallPostsTable);
  const [{ value: donations }] = await db
    .select({ value: count() })
    .from(donationsTable);
  const [{ total: raisedRaw }] = await db
    .select({ total: sum(donationsTable.amount) })
    .from(donationsTable)
    .where(eq(donationsTable.status, "paid"));

  const pending = await db
    .select()
    .from(wallPostsTable)
    .where(eq(wallPostsTable.status, "pending"))
    .orderBy(desc(wallPostsTable.createdAt))
    .limit(10);

  const recentDonations = await db
    .select()
    .from(donationsTable)
    .orderBy(desc(donationsTable.createdAt))
    .limit(10);

  const breakdown = await db
    .select({
      group: prayersTable.group,
      count: sql<number>`count(*)::int`,
    })
    .from(prayersTable)
    .groupBy(prayersTable.group);

  res.json({
    totals: {
      prayers,
      wallPosts,
      donations,
      raisedAmount: Number(raisedRaw ?? 0),
    },
    pendingWallPosts: pending.map((p) => ({
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
    recentDonations: recentDonations.map((d) => ({
      id: d.id,
      amount: d.amount,
      currency: d.currency,
      donorName: d.donorName,
      donorEmail: d.donorEmail,
      message: d.message,
      isRecurring: d.isRecurring,
      status: d.status,
      method: d.method,
      createdAt: (d.createdAt instanceof Date
        ? d.createdAt
        : new Date(d.createdAt)
      ).toISOString(),
    })),
    prayerGroupBreakdown: breakdown.map((b) => ({
      group: b.group as "daily" | "needs" | "liturgical",
      count: b.count,
    })),
  });
});

function shapeAdminPrayer(p: typeof prayersTable.$inferSelect) {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    summary: p.summary,
    body: p.body,
    group: p.group as "daily" | "needs" | "liturgical",
    categoryId: p.categoryId,
    categorySlug: null,
    categoryName: null,
    author: p.author,
    readingMinutes: p.readingMinutes,
    bookmarked: false,
    createdAt: (p.createdAt instanceof Date
      ? p.createdAt
      : new Date(p.createdAt)
    ).toISOString(),
  };
}

router.post("/admin/prayers", async (req, res): Promise<void> => {
  const parsed = AdminCreatePrayerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [created] = await db
    .insert(prayersTable)
    .values({ ...parsed.data })
    .returning();
  res.status(201).json(shapeAdminPrayer(created));
});

router.patch("/admin/prayers/:id", async (req, res): Promise<void> => {
  const params = AdminUpdatePrayerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = AdminUpdatePrayerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [updated] = await db
    .update(prayersTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(prayersTable.id, params.data.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Prayer not found" });
    return;
  }
  res.json(shapeAdminPrayer(updated));
});

router.delete("/admin/prayers/:id", async (req, res): Promise<void> => {
  const params = AdminDeletePrayerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(prayersTable).where(eq(prayersTable.id, params.data.id));
  res.sendStatus(204);
});

router.get("/admin/wall/pending", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(wallPostsTable)
    .where(eq(wallPostsTable.status, "pending"))
    .orderBy(desc(wallPostsTable.createdAt));
  res.json(
    rows.map((p) => ({
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
  );
});

router.post("/admin/wall/:id/moderate", async (req, res): Promise<void> => {
  const params = AdminModerateWallPostParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = AdminModerateWallPostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const newStatus =
    parsed.data.decision === "approve" ? "approved" : "rejected";
  const [updated] = await db
    .update(wallPostsTable)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(wallPostsTable.id, params.data.id))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Wall post not found" });
    return;
  }
  const { authUser } = req as AuthedRequest;
  await db.insert(moderationLogsTable).values({
    moderatorId: authUser.id,
    targetType: "wall_post",
    targetId: updated.id,
    decision: parsed.data.decision,
    note: parsed.data.note ?? null,
  });
  res.json({
    id: updated.id,
    displayName: updated.anonymous ? "Anonymous" : updated.displayName,
    message: updated.message,
    category: updated.category,
    prayCount: updated.prayCount,
    status: updated.status,
    createdAt: (updated.createdAt instanceof Date
      ? updated.createdAt
      : new Date(updated.createdAt)
    ).toISOString(),
  });
});

router.get("/admin/donations", async (req, res): Promise<void> => {
  const parsed = AdminListDonationsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const rows = await db
    .select()
    .from(donationsTable)
    .orderBy(desc(donationsTable.createdAt))
    .limit(parsed.data.limit);
  res.json(
    rows.map((d) => ({
      id: d.id,
      amount: d.amount,
      currency: d.currency,
      donorName: d.donorName,
      donorEmail: d.donorEmail,
      message: d.message,
      isRecurring: d.isRecurring,
      status: d.status,
      method: d.method,
      createdAt: (d.createdAt instanceof Date
        ? d.createdAt
        : new Date(d.createdAt)
      ).toISOString(),
    })),
  );
});

export default router;
