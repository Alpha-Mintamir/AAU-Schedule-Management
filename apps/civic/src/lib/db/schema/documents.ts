import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { LocalizedText } from "@/lib/i18n";
import {
  contentStatusEnum,
  documentAccessEnum,
  infoLayerEnum,
  verificationStatusEnum,
} from "./enums";
import { governmentOrganizations } from "./offices";
import { sources } from "./sources";
import { categories } from "./taxonomy";
import { users } from "./users";

/**
 * Document & template archive entry. `layer` is the critical field: the
 * system must never imply a community template is an official government
 * document. Files live in object storage (StorageProvider) and are served
 * only through the access-controlled download route — never directly.
 */
export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    title: jsonb("title").$type<LocalizedText>().notNull(),
    description: jsonb("description").$type<LocalizedText>(),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    /** Primary language of the document file itself, e.g. "am", "en", "am+en". */
    language: text("language").notNull().default("am"),
    /** e.g. form, contract, template, letter, application, agreement */
    docType: text("doc_type").notNull(),
    layer: infoLayerEnum("layer").notNull(),
    issuingOrganizationId: uuid("issuing_organization_id").references(
      () => governmentOrganizations.id,
      { onDelete: "set null" },
    ),
    version: text("version"),
    publishedDate: timestamp("published_date", { withTimezone: true }),
    sourceId: uuid("source_id").references(() => sources.id, { onDelete: "set null" }),
    license: text("license"),
    access: documentAccessEnum("access").notNull().default("moderated_public"),
    status: contentStatusEnum("status").notNull().default("draft"),
    verificationStatus: verificationStatusEnum("verification_status").notNull().default("unknown"),
    lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
    contributorId: uuid("contributor_id").references(() => users.id, { onDelete: "set null" }),
    currentVersionId: uuid("current_version_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("documents_category_idx").on(t.categoryId),
    index("documents_status_idx").on(t.status),
    index("documents_layer_idx").on(t.layer),
    index("documents_updated_idx").on(t.updatedAt),
  ],
);

/** Every uploaded file revision of a document. */
export const documentVersions = pgTable(
  "document_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull(),
    /** Opaque storage key; resolved by the StorageProvider, never a public URL. */
    storageKey: text("storage_key").notNull(),
    originalFilename: text("original_filename").notNull(),
    mimeType: text("mime_type").notNull(),
    /** File extension after validation, e.g. pdf, docx, xlsx, png. */
    format: text("format").notNull(),
    fileSize: integer("file_size").notNull(),
    sha256: text("sha256").notNull(),
    changeNote: text("change_note"),
    uploadedById: uuid("uploaded_by_id").references(() => users.id, { onDelete: "set null" }),
    /** Result of the (pluggable) malware scanning pipeline. */
    scanStatus: text("scan_status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("document_versions_document_idx").on(t.documentId, t.versionNumber)],
);
