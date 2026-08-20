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
import {
  contentStatusEnum,
  entityTypeEnum,
  infoLayerEnum,
  revisionStatusEnum,
  verificationStatusEnum,
} from "./enums";
import { locations } from "./locations";
import { categories } from "./taxonomy";
import { users } from "./users";

/**
 * Wikipedia-like knowledge page. Translatable fields are LocalizedText JSONB;
 * body content lives in page_sections so official and community layers can be
 * separated per section.
 */
export const knowledgePages = pgTable(
  "knowledge_pages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    title: jsonb("title").$type<LocalizedText>().notNull(),
    summary: jsonb("summary").$type<LocalizedText>().notNull(),
    status: contentStatusEnum("status").notNull().default("draft"),
    verificationStatus: verificationStatusEnum("verification_status").notNull().default("unknown"),
    lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    locationId: uuid("location_id").references(() => locations.id, { onDelete: "set null" }),
    createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),
    currentRevisionNumber: integer("current_revision_number").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("knowledge_pages_status_idx").on(t.status),
    index("knowledge_pages_category_idx").on(t.categoryId),
    index("knowledge_pages_location_idx").on(t.locationId),
    index("knowledge_pages_verification_idx").on(t.verificationStatus),
    index("knowledge_pages_updated_idx").on(t.updatedAt),
  ],
);

/**
 * A section of a knowledge page. `layer` marks whether the section conveys
 * official information (must carry citations) or community knowledge.
 * Body is Markdown, rendered through a sanitizing renderer.
 */
export const pageSections = pgTable(
  "page_sections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pageId: uuid("page_id")
      .notNull()
      .references(() => knowledgePages.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
    heading: jsonb("heading").$type<LocalizedText>().notNull(),
    body: jsonb("body").$type<LocalizedText>().notNull(),
    layer: infoLayerEnum("layer").notNull().default("community"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("page_sections_page_idx").on(t.pageId, t.sortOrder)],
);

/**
 * Generic revision store. Every meaningful modification of a versioned entity
 * creates a revision holding the full previous/new snapshots, the author, the
 * reason, and its review status. Editing is never a silent row update:
 * approved revisions are applied to the live entity by the revision service.
 */
export const revisions = pgTable(
  "revisions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entityType: entityTypeEnum("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    revisionNumber: integer("revision_number").notNull(),
    /** Snapshot of the entity content proposed by this revision. */
    snapshot: jsonb("snapshot").$type<Record<string, unknown>>().notNull(),
    /** Snapshot of the entity content before this revision was applied. */
    previousSnapshot: jsonb("previous_snapshot").$type<Record<string, unknown> | null>(),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    changeReason: text("change_reason").notNull(),
    status: revisionStatusEnum("status").notNull().default("pending"),
    reviewedById: uuid("reviewed_by_id").references(() => users.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewNote: text("review_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("revisions_entity_idx").on(t.entityType, t.entityId, t.revisionNumber),
    index("revisions_status_idx").on(t.status),
    uniqueIndex("revisions_unique_number_idx").on(t.entityType, t.entityId, t.revisionNumber),
  ],
);
