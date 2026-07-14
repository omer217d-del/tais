import { pgTable, serial, text, boolean, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const automationsTable = pgTable("automations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  naturalLanguageInput: text("natural_language_input").notNull(),
  triggerType: text("trigger_type").notNull(),
  triggerParams: jsonb("trigger_params").notNull().default({}),
  actionType: text("action_type").notNull(),
  actionParams: jsonb("action_params").notNull().default({}),
  enabled: boolean("enabled").notNull().default(true),
  executionCount: integer("execution_count").notNull().default(0),
  lastExecutedAt: timestamp("last_executed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAutomationSchema = createInsertSchema(automationsTable).omit({
  id: true,
  executionCount: true,
  lastExecutedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const selectAutomationSchema = createSelectSchema(automationsTable);

export type InsertAutomation = z.infer<typeof insertAutomationSchema>;
export type Automation = typeof automationsTable.$inferSelect;
