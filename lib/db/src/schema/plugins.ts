import { pgTable, serial, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pluginsTable = pgTable("plugins", {
  id: serial("id").primaryKey(),
  pluginId: text("plugin_id").notNull().unique(),
  name: text("name").notNull(),
  version: text("version").notNull(),
  description: text("description").notNull(),
  author: text("author"),
  enabled: boolean("enabled").notNull().default(true),
  manifestJson: jsonb("manifest_json").notNull(),
  installedAt: timestamp("installed_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPluginSchema = createInsertSchema(pluginsTable).omit({
  id: true,
  installedAt: true,
  updatedAt: true,
});

export const selectPluginSchema = createSelectSchema(pluginsTable);

export type InsertPlugin = z.infer<typeof insertPluginSchema>;
export type Plugin = typeof pluginsTable.$inferSelect;
