import { Router, type IRouter } from "express";
import { desc, eq, sum, count, sql } from "drizzle-orm";
import { db, donationsTable } from "@workspace/db";
import { CreateDonationBody } from "@workspace/api-zod";
import { ensureUser } from "../lib/auth";

const router: IRouter = Router();

const FUND_GOAL = 50000000;
const ALLOCATIONS = [
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
];

function gatewayConfigured(): boolean {
  return Boolean(
    process.env.MIDTRANS_SERVER_KEY ||
      process.env.XENDIT_SECRET_KEY,
  );
}

router.post("/donations", async (req, res): Promise<void> => {
  const parsed = CreateDonationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const user = await ensureUser(req);
  const { amount, currency, method, donorName, donorEmail, message, isRecurring } =
    parsed.data;

  const [created] = await db
    .insert(donationsTable)
    .values({
      userId: user?.id ?? null,
      donorName,
      donorEmail: donorEmail ?? null,
      message: message ?? null,
      amount,
      currency,
      method,
      isRecurring,
      status: "pending",
    })
    .returning();

  const configured = gatewayConfigured();
  const instructions = configured
    ? "We are creating your secure payment link. You'll be redirected shortly."
    : "Thank you for your generosity. The payment gateway is not yet connected, so this gift is recorded as a pending pledge. Our team will reach out at the email you provided to complete the transfer.";

  res.status(201).json({
    id: created.id,
    status: "pending" as const,
    instructions,
    gatewayConfigured: configured,
  });
});

router.get("/donations/transparency", async (_req, res): Promise<void> => {
  const [{ total: raisedRaw, donors }] = await db
    .select({
      total: sum(donationsTable.amount),
      donors: count(),
    })
    .from(donationsTable)
    .where(eq(donationsTable.status, "paid"));

  const recents = await db
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
    .limit(8);

  res.json({
    goalAmount: FUND_GOAL,
    raisedAmount: Number(raisedRaw ?? 0),
    currency: "IDR",
    donorCount: Number(donors ?? 0),
    recentDonors: recents.map((r) => ({
      donorName: r.donorName,
      amount: r.amount,
      currency: r.currency,
      message: r.message,
      createdAt: (r.createdAt instanceof Date
        ? r.createdAt
        : new Date(r.createdAt)
      ).toISOString(),
    })),
    allocations: ALLOCATIONS,
  });
});

export default router;
