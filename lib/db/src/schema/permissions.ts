import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const appPermissionsTable = pgTable("app_permissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  androidPermission: text("android_permission").notNull().unique(),
  description: text("description").notNull(),
  category: text("category").notNull(), // sensor, connectivity, media, system, location, storage
  granted: boolean("granted").notNull().default(false),
  required: boolean("required").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAppPermissionSchema = createInsertSchema(appPermissionsTable).omit({
  id: true,
  updatedAt: true,
});

export const selectAppPermissionSchema = createSelectSchema(appPermissionsTable);

export type InsertAppPermission = z.infer<typeof insertAppPermissionSchema>;
export type AppPermission = typeof appPermissionsTable.$inferSelect;
