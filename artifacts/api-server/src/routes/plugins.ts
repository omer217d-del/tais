import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { pluginsTable } from "@workspace/db";
import {
  InstallPluginBody,
  GetPluginParams,
  DeletePluginParams,
  TogglePluginParams,
} from "@workspace/api-zod";

const router = Router();

function toApiPlugin(row: typeof pluginsTable.$inferSelect) {
  return {
    id: row.id,
    pluginId: row.pluginId,
    name: row.name,
    version: row.version,
    description: row.description,
    author: row.author ?? null,
    enabled: row.enabled,
    manifest: row.manifestJson as Record<string, unknown>,
    installedAt: row.installedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// GET /api/plugins
router.get("/", async (_req, res) => {
  const rows = await db
    .select()
    .from(pluginsTable)
    .orderBy(desc(pluginsTable.installedAt));
  res.json(rows.map(toApiPlugin));
});

// GET /api/plugins/:id
router.get("/:id", async (req, res) => {
  const parseResult = GetPluginParams.safeParse({ id: Number(req.params.id) });
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [row] = await db
    .select()
    .from(pluginsTable)
    .where(eq(pluginsTable.id, parseResult.data.id))
    .limit(1);

  if (!row) {
    res.status(404).json({ error: "Plugin not found" });
    return;
  }
  res.json(toApiPlugin(row));
});

// POST /api/plugins
router.post("/", async (req, res) => {
  const parseResult = InstallPluginBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const { manifest, enabled } = parseResult.data;

  const existing = await db
    .select()
    .from(pluginsTable)
    .where(eq(pluginsTable.pluginId, manifest.id))
    .limit(1);

  if (existing[0]) {
    res.status(409).json({ error: "Plugin already installed" });
    return;
  }

  const [created] = await db
    .insert(pluginsTable)
    .values({
      pluginId: manifest.id,
      name: manifest.name,
      version: manifest.version,
      description: manifest.description,
      author: manifest.author ?? null,
      enabled: enabled ?? true,
      manifestJson: manifest as unknown as Record<string, unknown>,
    })
    .returning();

  res.status(201).json(toApiPlugin(created));
});

// DELETE /api/plugins/:id
router.delete("/:id", async (req, res) => {
  const parseResult = DeletePluginParams.safeParse({ id: Number(req.params.id) });
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(pluginsTable).where(eq(pluginsTable.id, parseResult.data.id));
  res.status(204).end();
});

// PATCH /api/plugins/:id/toggle
router.patch("/:id/toggle", async (req, res) => {
  const parseResult = TogglePluginParams.safeParse({ id: Number(req.params.id) });
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [existing] = await db
    .select()
    .from(pluginsTable)
    .where(eq(pluginsTable.id, parseResult.data.id))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Plugin not found" });
    return;
  }

  const [updated] = await db
    .update(pluginsTable)
    .set({ enabled: !existing.enabled, updatedAt: new Date() })
    .where(eq(pluginsTable.id, parseResult.data.id))
    .returning();

  res.json(toApiPlugin(updated));
});

export default router;
