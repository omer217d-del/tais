import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const aiModelsTable = pgTable("ai_models", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  provider: text("provider").notNull(), // qwen, gemma, phi, smollm, tinyllama, custom
  filename: text("filename").notNull(),
  localPath: text("local_path"),
  downloadUrl: text("download_url"),
  sizeBytes: integer("size_bytes"),
  quantization: text("quantization"),
  contextLength: integer("context_length"),
  isActive: boolean("is_active").notNull().default(false),
  status: text("status").notNull().default("missing"), // available, downloading, error, missing
  downloadProgress: integer("download_progress"),
  installedAt: timestamp("installed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAiModelSchema = createInsertSchema(aiModelsTable).omit({
  id: true,
  isActive: true,
  status: true,
  downloadProgress: true,
  installedAt: true,
  createdAt: true,
});

export const selectAiModelSchema = createSelectSchema(aiModelsTable);

export type InsertAiModel = z.infer<typeof insertAiModelSchema>;
export type AiModel = typeof aiModelsTable.$inferSelect;
