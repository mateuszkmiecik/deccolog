import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const catalog = pgTable("catalogs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  password: text("password").notNull(),
});

export const items = pgTable("items", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  catalogId: integer("catalog_id").references(() => catalog.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  tags: text("tags").array().notNull().default([]),
  fingerprint: text("fingerprint").notNull(),
  photoId: text("photo_id"),
});