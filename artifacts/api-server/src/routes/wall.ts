import { Router, type IRouter } from "express";
import { and, eq, desc, sql, count } from "drizzle-orm";
import { db, wallPostsTable } from "@workspace/db";
import {
  ListWallPostsQueryParams,
  CreateWallPostBody,
  PrayForWallPostParams,
} from "@workspace/api-zod";
import { ensureUser } from "../lib/auth";

const router: IRouter = Router();

function shapePost(p: typeof wallPostsTable.$inferSelect) {
  return {
    id: p.id,
    displayName: p.anonymous ? "Anonymous" : p.displayName,
    message: p.message,
    category: p.category,
    prayCount: p.prayCount,
    status: p.status as "pending" | "approved" | "rejected",
    createdAt: (p.createdAt instanceof Date
      ? p.createdAt
      : new Date(p.createdAt)
    ).toISOString(),
  };
}

router.get("/wall", async (req, res): Promise<void> => {
  const parsed = ListWallPostsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { category, limit, offset } = parsed.data;

  const conditions = [eq(wallPostsTable.status, "approved")];
  if (category) conditions.push(eq(wallPostsTable.category, category));
  const whereClause = and(...conditions);

  const rows = await db
    .select()
    .from(wallPostsTable)
    .where(whereClause)
    .orderBy(desc(wallPostsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(wallPostsTable)
    .where(whereClause);

  res.json({ items: rows.map(shapePost), total });
});

router.post("/wall", async (req, res): Promise<void> => {
  const parsed = CreateWallPostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const user = await ensureUser(req);
  const { message, category, anonymous, displayName } = parsed.data;

  const finalName = anonymous
    ? "Anonymous"
    : (displayName?.trim() || user?.displayName || "Friend");

  const ip =
    (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    null;

  const [created] = await db
    .insert(wallPostsTable)
    .values({
      userId: user?.id ?? null,
      displayName: finalName,
      anonymous,
      message,
      category,
      status: "pending",
      submitterIp: ip,
    })
    .returning();

  res.status(201).json(shapePost(created));
});

router.post("/wall/:id/pray", async (req, res): Promise<void> => {
  const parsed = PrayForWallPostParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [updated] = await db
    .update(wallPostsTable)
    .set({ prayCount: sql`${wallPostsTable.prayCount} + 1` })
    .where(
      and(
        eq(wallPostsTable.id, parsed.data.id),
        eq(wallPostsTable.status, "approved"),
      ),
    )
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  res.json(shapePost(updated));
});

export default router;
