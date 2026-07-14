import { pgTable, serial, text, boolean, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const appSettingsTable = pgTable("app_settings", {
  id: serial("id").primaryKey(),
  theme: text("theme").notNull().default("dark"), // light, dark, system
  language: text("language").notNull().default("tr"),
  developerMode: boolean("developer_mode").notNull().default(false),
  aiTemperature: real("ai_temperature").notNull().default(0.7),
  aiMaxTokens: integer("ai_max_tokens").notNull().default(512),
  aiContextLength: integer("ai_context_length").notNull().default(2048),
  foregroundServiceEnabled: boolean("foreground_service_enabled").notNull().default(true),
  batteryOptimizationIgnored: boolean("battery_optimization_ignored").notNull().default(false),
  logLevel: text("log_level").notNull().default("info"), // debug, info, warn, error
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAppSettingsSchema = createInsertSchema(appSettingsTable).omit({
  id: true,
  updatedAt: true,
});

export const selectAppSettingsSchema = createSelectSchema(appSettingsTable);

export type InsertAppSettings = z.infer<typeof insertAppSettingsSchema>;
export type AppSettings = typeof appSettingsTable.$inferSelect;
