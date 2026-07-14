import { Router } from "express";
import { db } from "@workspace/db";
import { appSettingsTable } from "@workspace/db";
import { UpdateSettingsBody } from "@workspace/api-zod";

const router = Router();

const DEFAULT_SETTINGS = {
  theme: "dark",
  language: "tr",
  developerMode: false,
  aiTemperature: 0.7,
  aiMaxTokens: 512,
  aiContextLength: 2048,
  foregroundServiceEnabled: true,
  batteryOptimizationIgnored: false,
  logLevel: "info",
};

async function getOrCreateSettings() {
  const existing = await db.select().from(appSettingsTable).limit(1);
  if (existing[0]) return existing[0];

  const [created] = await db.insert(appSettingsTable).values(DEFAULT_SETTINGS).returning();
  return created;
}

function toApiSettings(row: typeof appSettingsTable.$inferSelect) {
  return {
    id: row.id,
    theme: row.theme,
    language: row.language,
    developerMode: row.developerMode,
    aiTemperature: row.aiTemperature,
    aiMaxTokens: row.aiMaxTokens,
    aiContextLength: row.aiContextLength,
    foregroundServiceEnabled: row.foregroundServiceEnabled,
    batteryOptimizationIgnored: row.batteryOptimizationIgnored,
    logLevel: row.logLevel,
    updatedAt: row.updatedAt.toISOString(),
  };
}

// GET /api/settings
router.get("/", async (_req, res) => {
  const settings = await getOrCreateSettings();
  res.json(toApiSettings(settings));
});

// PATCH /api/settings
router.patch("/", async (req, res) => {
  const parseResult = UpdateSettingsBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const settings = await getOrCreateSettings();
  const body = parseResult.data;

  const updateData: Partial<typeof appSettingsTable.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (body.theme !== undefined) updateData.theme = body.theme;
  if (body.language !== undefined) updateData.language = body.language;
  if (body.developerMode !== undefined) updateData.developerMode = body.developerMode;
  if (body.aiTemperature !== undefined) updateData.aiTemperature = body.aiTemperature;
  if (body.aiMaxTokens !== undefined) updateData.aiMaxTokens = body.aiMaxTokens;
  if (body.aiContextLength !== undefined) updateData.aiContextLength = body.aiContextLength;
  if (body.foregroundServiceEnabled !== undefined) updateData.foregroundServiceEnabled = body.foregroundServiceEnabled;
  if (body.batteryOptimizationIgnored !== undefined) updateData.batteryOptimizationIgnored = body.batteryOptimizationIgnored;
  if (body.logLevel !== undefined) updateData.logLevel = body.logLevel;

  const { eq } = await import("drizzle-orm");
  const [updated] = await db
    .update(appSettingsTable)
    .set(updateData)
    .where(eq(appSettingsTable.id, settings.id))
    .returning();

  res.json(toApiSettings(updated));
});

export default router;
