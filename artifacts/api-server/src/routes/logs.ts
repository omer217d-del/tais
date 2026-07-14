import { Router } from "express";
import { eq, desc, and, isNotNull } from "drizzle-orm";
import { db } from "@workspace/db";
import { logEntriesTable } from "@workspace/db";
import { ListLogsQueryParams } from "@workspace/api-zod";

const router = Router();

function toApiLog(row: typeof logEntriesTable.$inferSelect) {
  return {
    id: row.id,
    level: row.level,
    message: row.message,
    source: row.source ?? null,
    automationId: row.automationId ?? null,
    pluginId: row.pluginId ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? null,
    timestamp: row.timestamp.toISOString(),
  };
}

// GET /api/logs
router.get("/", async (req, res) => {
  const parseResult = ListLogsQueryParams.safeParse({
    level: req.query.level,
    automationId: req.query.automationId !== undefined ? Number(req.query.automationId) : undefined,
    limit: req.query.limit !== undefined ? Number(req.query.limit) : undefined,
    offset: req.query.offset !== undefined ? Number(req.query.offset) : undefined,
  });

  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }

  const { level, automationId, limit = 100, offset = 0 } = parseResult.data;

  let query = db.select().from(logEntriesTable).$dynamic();

  if (level) {
    query = query.where(eq(logEntriesTable.level, level));
  }
  if (automationId !== undefined && automationId !== null) {
    query = query.where(eq(logEntriesTable.automationId, automationId));
  }

  const all = await db.select().from(logEntriesTable).orderBy(desc(logEntriesTable.timestamp));

  let filtered = all;
  if (level) filtered = filtered.filter((r) => r.level === level);
  if (automationId !== undefined && automationId !== null) {
    filtered = filtered.filter((r) => r.automationId === automationId);
  }

  const total = filtered.length;
  const items = filtered.slice(offset, offset + limit);

  res.json({
    items: items.map(toApiLog),
    total,
    limit,
    offset,
  });
});

// GET /api/logs/stats
router.get("/stats", async (_req, res) => {
  const all = await db.select().from(logEntriesTable).orderBy(desc(logEntriesTable.timestamp));

  const byLevel = { debug: 0, info: 0, warn: 0, error: 0 };
  for (const entry of all) {
    const lvl = entry.level as keyof typeof byLevel;
    if (lvl in byLevel) byLevel[lvl]++;
  }

  const recentErrors = all.filter((e) => e.level === "error").slice(0, 5);

  res.json({
    total: all.length,
    byLevel,
    recentErrors: recentErrors.map(toApiLog),
  });
});

// DELETE /api/logs
router.delete("/", async (_req, res) => {
  await db.delete(logEntriesTable);
  res.status(204).end();
});

export default router;
