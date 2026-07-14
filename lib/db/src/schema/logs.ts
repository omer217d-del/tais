import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const logEntriesTable = pgTable("log_entries", {
  id: serial("id").primaryKey(),
  level: text("level").notNull(), // debug, info, warn, error
  message: text("message").notNull(),
  source: text("source"),
  automationId: integer("automation_id"),
  pluginId: integer("plugin_id"),
  metadata: jsonb("metadata"),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLogEntrySchema = createInsertSchema(logEntriesTable).omit({
  id: true,
  timestamp: true,
});

export const selectLogEntrySchema = createSelectSchema(logEntriesTable);

export type InsertLogEntry = z.infer<typeof insertLogEntrySchema>;
export type LogEntry = typeof logEntriesTable.$inferSelect;
