import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, bookmarksTable } from "@workspace/db";
import { UpdatePreferencesBody } from "@workspace/api-zod";
import { requireAuth, type AuthedRequest } from "../lib/auth";

const router: IRouter = Router();

function toPreferences(u: typeof usersTable.$inferSelect) {
  return {
    fontScale: u.fontScale as "sm" | "md" | "lg" | "xl",
    theme: u.theme as "light" | "dark" | "system",
    morningReminder: u.morningReminder,
    eveningReminder: u.eveningReminder,
    reminderChannel: u.reminderChannel as "email" | "push" | "none",
    language: u.language as "id" | "en",
  };
}

router.get("/me", requireAuth, async (req, res): Promise<void> => {
  const { authUser } = req as AuthedRequest;
  const [u] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, authUser.id));
  const bookmarks = await db
    .select({ prayerId: bookmarksTable.prayerId })
    .from(bookmarksTable)
    .where(eq(bookmarksTable.userId, authUser.id));

  res.json({
    user: {
      id: u.id,
      displayName: u.displayName,
      email: u.email,
    },
    preferences: toPreferences(u),
    isAdmin: u.isAdmin,
    bookmarkedPrayerIds: bookmarks.map((b) => b.prayerId),
  });
});

router.patch(
  "/me/preferences",
  requireAuth,
  async (req, res): Promise<void> => {
    const parsed = UpdatePreferencesBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const { authUser } = req as AuthedRequest;
    const [updated] = await db
      .update(usersTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(usersTable.id, authUser.id))
      .returning();
    res.json(toPreferences(updated));
  },
);

export default router;
