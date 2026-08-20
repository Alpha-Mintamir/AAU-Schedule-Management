import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { entityTypeEnum, sourceReliabilityEnum, sourceTypeEnum } from "./enums";
import { users } from "./users";

/**
 * A source is an external reference (government website, PDF, law, portal,
 * announcement, community submission). Every important claim on the platform
 * should be traceable to a source through citations.
 */
export const sources = pgTable(
  "sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    url: text("url"),
    title: text("title").notNull(),
    organization: text("organization"),
    type: sourceTypeEnum("type").notNull(),
    reliability: sourceReliabilityEnum("reliability").notNull().default("unverified"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    retrievedAt: timestamp("retrieved_at", { withTimezone: true }),
    version: text("version"),
    notes: text("notes"),
    addedById: uuid("added_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sources_type_idx").on(t.type), index("sources_reliability_idx").on(t.reliability)],
);

/** Links a source to a specific entity (page, process, office, document, ...). */
export const citations = pgTable(
  "citations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "cascade" }),
    entityType: entityTypeEnum("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    /** Optional anchor, e.g. a section id or step id within the entity. */
    anchor: text("anchor"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("citations_entity_idx").on(t.entityType, t.entityId),
    uniqueIndex("citations_unique_idx").on(t.sourceId, t.entityType, t.entityId, t.anchor),
  ],
);
