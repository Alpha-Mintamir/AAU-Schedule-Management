import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { entityTypeEnum, verificationStatusEnum } from "./enums";

/**
 * Denormalized search index. Content services upsert one row per
 * (entity, locale) when content is published or updated. The Postgres search
 * provider queries this table with full-text search (tsvector generated
 * column added in SQL migration 0001) plus trigram similarity for typo
 * tolerance. Because search reads only from this table, the provider can be
 * swapped for Elasticsearch/OpenSearch/Typesense without touching content
 * services (see lib/search/provider.ts).
 */
export const searchDocuments = pgTable(
  "search_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entityType: entityTypeEnum("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    locale: text("locale").notNull(),
    slug: text("slug").notNull(),
    /** Route path for the result, e.g. /processes/create-plc */
    url: text("url").notNull(),
    title: text("title").notNull(),
    summary: text("summary"),
    body: text("body"),
    /** Space-separated aliases, tags, acronyms and cross-language equivalents. */
    keywords: text("keywords"),
    verificationStatus: verificationStatusEnum("verification_status").notNull().default("unknown"),
    /** Extra facet data (category slug, location slug) for filtering. */
    facets: jsonb("facets").$type<Record<string, string>>(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("search_documents_entity_locale_idx").on(t.entityType, t.entityId, t.locale),
    index("search_documents_type_idx").on(t.entityType),
  ],
);

/**
 * Cross-language / acronym aliases, e.g. "TIN", "ቲን" and
 * "tax identification number" all resolving to the same concept. The indexer
 * folds aliases into search_documents.keywords.
 */
export const searchAliases = pgTable(
  "search_aliases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entityType: entityTypeEnum("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    alias: text("alias").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("search_aliases_entity_idx").on(t.entityType, t.entityId),
    uniqueIndex("search_aliases_unique_idx").on(t.entityType, t.entityId, t.alias),
  ],
);
