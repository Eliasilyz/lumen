import { Router, type IRouter } from "express";
import { and, eq, desc } from "drizzle-orm";
import {
  db,
  bookmarksTable,
  prayersTable,
  categoriesTable,
} from "@workspace/db";
import { AddBookmarkBody, RemoveBookmarkParams } from "@workspace/api-zod";
import { requireAuth, type AuthedRequest } from "../lib/auth";

const router: IRouter = Router();

router.get("/bookmarks", requireAuth, async (req, res): Promise<void> => {
  const { authUser } = req as AuthedRequest;
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
      bookmarkedAt: bookmarksTable.createdAt,
    })
    .from(bookmarksTable)
    .innerJoin(prayersTable, eq(prayersTable.id, bookmarksTable.prayerId))
    .leftJoin(categoriesTable, eq(prayersTable.categoryId, categoriesTable.id))
    .where(eq(bookmarksTable.userId, authUser.id))
    .orderBy(desc(bookmarksTable.createdAt));

  res.json(
    rows.map((p) => ({
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
      bookmarked: true,
      createdAt: (p.createdAt instanceof Date
        ? p.createdAt
        : new Date(p.createdAt)
      ).toISOString(),
    })),
  );
});

router.post("/bookmarks", requireAuth, async (req, res): Promise<void> => {
  const parsed = AddBookmarkBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { authUser } = req as AuthedRequest;

  const [exists] = await db
    .select({ id: prayersTable.id })
    .from(prayersTable)
    .where(eq(prayersTable.id, parsed.data.prayerId));
  if (!exists) {
    res.status(404).json({ error: "Prayer not found" });
    return;
  }

  const [b] = await db
    .insert(bookmarksTable)
    .values({ userId: authUser.id, prayerId: parsed.data.prayerId })
    .onConflictDoNothing()
    .returning();

  let bookmark = b;
  if (!bookmark) {
    const [existing] = await db
      .select()
      .from(bookmarksTable)
      .where(
        and(
          eq(bookmarksTable.userId, authUser.id),
          eq(bookmarksTable.prayerId, parsed.data.prayerId),
        ),
      );
    bookmark = existing;
  }

  res.json({
    prayerId: bookmark.prayerId,
    createdAt: (bookmark.createdAt instanceof Date
      ? bookmark.createdAt
      : new Date(bookmark.createdAt)
    ).toISOString(),
  });
});

router.delete(
  "/bookmarks/:prayerId",
  requireAuth,
  async (req, res): Promise<void> => {
    const parsed = RemoveBookmarkParams.safeParse(req.params);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const { authUser } = req as AuthedRequest;
    await db
      .delete(bookmarksTable)
      .where(
        and(
          eq(bookmarksTable.userId, authUser.id),
          eq(bookmarksTable.prayerId, parsed.data.prayerId),
        ),
      );
    res.sendStatus(204);
  },
);

export default router;
