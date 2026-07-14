import { Router } from "express";
import { eq, desc, sql, count } from "drizzle-orm";
import { db } from "@workspace/db";
import { automationsTable } from "@workspace/db";
import {
  CreateAutomationBody,
  UpdateAutomationBody,
  GetAutomationParams,
  UpdateAutomationParams,
  DeleteAutomationParams,
  ToggleAutomationParams,
  ListAutomationsQueryParams,
} from "@workspace/api-zod";

const router = Router();

function toApiAutomation(row: typeof automationsTable.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    naturalLanguageInput: row.naturalLanguageInput,
    trigger: {
      type: row.triggerType,
      parameters: (row.triggerParams as Record<string, unknown>) ?? {},
    },
    action: {
      type: row.actionType,
      parameters: (row.actionParams as Record<string, unknown>) ?? {},
    },
    enabled: row.enabled,
    executionCount: row.executionCount,
    lastExecutedAt: row.lastExecutedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// GET /api/automations
router.get("/", async (req, res) => {
  const parseResult = ListAutomationsQueryParams.safeParse(req.query);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }
  const { enabled, triggerType } = parseResult.data;

  let rows = await db
    .select()
    .from(automationsTable)
    .orderBy(desc(automationsTable.createdAt));

  if (enabled !== undefined) {
    rows = rows.filter((r) => r.enabled === enabled);
  }
  if (triggerType !== undefined) {
    rows = rows.filter((r) => r.triggerType === triggerType);
  }

  res.json(rows.map(toApiAutomation));
});

// GET /api/automations/stats
router.get("/stats", async (_req, res) => {
  const all = await db.select().from(automationsTable).orderBy(desc(automationsTable.lastExecutedAt));

  const total = all.length;
  const enabledCount = all.filter((a) => a.enabled).length;
  const totalExecutions = all.reduce((sum, a) => sum + a.executionCount, 0);

  const byTriggerMap = new Map<string, number>();
  for (const a of all) {
    byTriggerMap.set(a.triggerType, (byTriggerMap.get(a.triggerType) ?? 0) + 1);
  }

  const recentExecutions = all
    .filter((a) => a.lastExecutedAt !== null)
    .sort((a, b) => (b.lastExecutedAt?.getTime() ?? 0) - (a.lastExecutedAt?.getTime() ?? 0))
    .slice(0, 5);

  res.json({
    total,
    enabled: enabledCount,
    disabled: total - enabledCount,
    totalExecutions,
    byTriggerType: Array.from(byTriggerMap.entries()).map(([type, count]) => ({ type, count })),
    recentExecutions: recentExecutions.map(toApiAutomation),
  });
});

// GET /api/automations/:id
router.get("/:id", async (req, res) => {
  const parseResult = GetAutomationParams.safeParse({ id: Number(req.params.id) });
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [row] = await db
    .select()
    .from(automationsTable)
    .where(eq(automationsTable.id, parseResult.data.id))
    .limit(1);

  if (!row) {
    res.status(404).json({ error: "Automation not found" });
    return;
  }
  res.json(toApiAutomation(row));
});

// POST /api/automations
router.post("/", async (req, res) => {
  const parseResult = CreateAutomationBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const body = parseResult.data;

  const [created] = await db
    .insert(automationsTable)
    .values({
      name: body.name,
      description: body.description ?? null,
      naturalLanguageInput: body.naturalLanguageInput,
      triggerType: body.trigger.type,
      triggerParams: (body.trigger.parameters ?? {}) as Record<string, unknown>,
      actionType: body.action.type,
      actionParams: (body.action.parameters ?? {}) as Record<string, unknown>,
      enabled: body.enabled ?? true,
    })
    .returning();

  res.status(201).json(toApiAutomation(created));
});

// PATCH /api/automations/:id
router.patch("/:id", async (req, res) => {
  const paramResult = UpdateAutomationParams.safeParse({ id: Number(req.params.id) });
  if (!paramResult.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const bodyResult = UpdateAutomationBody.safeParse(req.body);
  if (!bodyResult.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const existing = await db
    .select()
    .from(automationsTable)
    .where(eq(automationsTable.id, paramResult.data.id))
    .limit(1);

  if (!existing[0]) {
    res.status(404).json({ error: "Automation not found" });
    return;
  }

  const body = bodyResult.data;
  const updateData: Partial<typeof automationsTable.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (body.name !== undefined) updateData.name = body.name;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.naturalLanguageInput !== undefined) updateData.naturalLanguageInput = body.naturalLanguageInput;
  if (body.trigger !== undefined) {
    updateData.triggerType = body.trigger.type;
    updateData.triggerParams = (body.trigger.parameters ?? {}) as Record<string, unknown>;
  }
  if (body.action !== undefined) {
    updateData.actionType = body.action.type;
    updateData.actionParams = (body.action.parameters ?? {}) as Record<string, unknown>;
  }
  if (body.enabled !== undefined) updateData.enabled = body.enabled;

  const [updated] = await db
    .update(automationsTable)
    .set(updateData)
    .where(eq(automationsTable.id, paramResult.data.id))
    .returning();

  res.json(toApiAutomation(updated));
});

// DELETE /api/automations/:id
router.delete("/:id", async (req, res) => {
  const parseResult = DeleteAutomationParams.safeParse({ id: Number(req.params.id) });
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(automationsTable).where(eq(automationsTable.id, parseResult.data.id));
  res.status(204).end();
});

// PATCH /api/automations/:id/toggle
router.patch("/:id/toggle", async (req, res) => {
  const parseResult = ToggleAutomationParams.safeParse({ id: Number(req.params.id) });
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [existing] = await db
    .select()
    .from(automationsTable)
    .where(eq(automationsTable.id, parseResult.data.id))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Automation not found" });
    return;
  }

  const [updated] = await db
    .update(automationsTable)
    .set({ enabled: !existing.enabled, updatedAt: new Date() })
    .where(eq(automationsTable.id, parseResult.data.id))
    .returning();

  res.json(toApiAutomation(updated));
});

export default router;
