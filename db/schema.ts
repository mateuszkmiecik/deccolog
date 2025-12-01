import { bigint, integer, pgTable, primaryKey, serial, text, timestamp } from "drizzle-orm/pg-core";

export const catalog = pgTable("catalogs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  password: text("password").notNull(),
});

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  catalogId: integer("catalog_id").references(() => catalog.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  tags: text("tags").array().notNull().default([]),
  fingerprint: text("fingerprint").notNull(),
  fingerprint_bigint: bigint({ mode: "bigint" }),
  photoUrl: text("photo_url"),
});

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  catalogId: integer("catalog_id").references(() => catalog.id),
});

export const itemsTags = pgTable("items_tags", {
  itemId: integer("item_id").notNull().references(() => items.id),
  tagId: integer("tag_id").notNull().references(() => tags.id),
}, t => [
  primaryKey({ columns: [t.itemId, t.tagId] })
])