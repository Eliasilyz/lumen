import { Router, type IRouter } from "express";
import { sql, eq, count } from "drizzle-orm";
import { db, categoriesTable, prayersTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/categories", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: categoriesTable.id,
      slug: categoriesTable.slug,
      name: categoriesTable.name,
      group: categoriesTable.group,
      description: categoriesTable.description,
      prayerCount: sql<number>`coalesce(count(${prayersTable.id}), 0)::int`,
    })
    .from(categoriesTable)
    .leftJoin(prayersTable, eq(prayersTable.categoryId, categoriesTable.id))
    .groupBy(categoriesTable.id)
    .orderBy(categoriesTable.group, categoriesTable.name);

  res.json(rows);
});

export default router;
