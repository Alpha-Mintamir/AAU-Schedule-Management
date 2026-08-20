import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { LocalizedText } from "@/lib/i18n";
import { entityTypeEnum } from "./enums";

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: jsonb("name").$type<LocalizedText>().notNull(),
    description: jsonb("description").$type<LocalizedText>(),
    /** Lucide icon name used in the UI; purely presentational. */
    icon: text("icon"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
);

export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: jsonb("name").$type<LocalizedText>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const entityTags = pgTable(
  "entity_tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    entityType: entityTypeEnum("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
  },
  (t) => [
    uniqueIndex("entity_tags_unique_idx").on(t.tagId, t.entityType, t.entityId),
    index("entity_tags_entity_idx").on(t.entityType, t.entityId),
  ],
);

/**
 * Generic typed link between two entities ("related pages", "related
 * processes", "related offices", "related documents").
 */
export const entityLinks = pgTable(
  "entity_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fromType: entityTypeEnum("from_type").notNull(),
    fromId: uuid("from_id").notNull(),
    toType: entityTypeEnum("to_type").notNull(),
    toId: uuid("to_id").notNull(),
    relation: text("relation").notNull().default("related"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("entity_links_from_idx").on(t.fromType, t.fromId),
    index("entity_links_to_idx").on(t.toType, t.toId),
    uniqueIndex("entity_links_unique_idx").on(t.fromType, t.fromId, t.toType, t.toId, t.relation),
  ],
);
