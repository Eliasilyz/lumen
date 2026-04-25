import type { Request, Response, NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { eq, count } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

export type AuthedRequest = Request & {
  authUser: {
    id: string;
    email: string | null;
    displayName: string;
    isAdmin: boolean;
  };
};

export async function ensureUser(req: Request): Promise<{
  id: string;
  email: string | null;
  displayName: string;
  isAdmin: boolean;
} | null> {
  const auth = getAuth(req);
  if (!auth?.userId) return null;

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, auth.userId))
    .limit(1);

  if (existing[0]) {
    return {
      id: existing[0].id,
      email: existing[0].email,
      displayName: existing[0].displayName,
      isAdmin: existing[0].isAdmin,
    };
  }

  let email: string | null = null;
  let displayName = "Friend";
  try {
    const clerkUser = await clerkClient.users.getUser(auth.userId);
    email =
      clerkUser.primaryEmailAddress?.emailAddress ??
      clerkUser.emailAddresses[0]?.emailAddress ??
      null;
    displayName =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
      clerkUser.username ||
      email?.split("@")[0] ||
      "Friend";
  } catch (err) {
    req.log.warn({ err }, "Failed to fetch Clerk user, using fallback");
  }

  const [{ value: existingCount }] = await db
    .select({ value: count() })
    .from(usersTable);
  const isFirst = existingCount === 0;

  const [created] = await db
    .insert(usersTable)
    .values({
      id: auth.userId,
      email,
      displayName,
      isAdmin: isFirst,
    })
    .returning();

  return {
    id: created.id,
    email: created.email,
    displayName: created.displayName,
    isAdmin: created.isAdmin,
  };
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const user = await ensureUser(req);
  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  (req as AuthedRequest).authUser = user;
  next();
}

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const user = await ensureUser(req);
  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  if (!user.isAdmin) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  (req as AuthedRequest).authUser = user;
  next();
}
