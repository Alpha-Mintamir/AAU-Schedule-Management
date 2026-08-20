import {
  doublePrecision,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import type { LocalizedText } from "@/lib/i18n";
import { locationTypeEnum } from "./enums";

/**
 * Geographic hierarchy: Country -> Region -> City -> Sub-city -> Woreda.
 * Modeled as an adjacency list so any Ethiopian region can be added without
 * schema changes. Nothing in the schema assumes Addis Ababa.
 */
export const locations = pgTable(
  "locations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: locationTypeEnum("type").notNull(),
    parentId: uuid("parent_id").references((): AnyPgColumn => locations.id, {
      onDelete: "restrict",
    }),
    slug: text("slug").notNull().unique(),
    name: jsonb("name").$type<LocalizedText>().notNull(),
    description: jsonb("description").$type<LocalizedText>(),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("locations_parent_idx").on(t.parentId), index("locations_type_idx").on(t.type)],
);
