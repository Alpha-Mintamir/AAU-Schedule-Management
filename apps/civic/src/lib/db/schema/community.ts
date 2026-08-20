import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import {
  contributionStatusEnum,
  contributionTypeEnum,
  entityTypeEnum,
  flagReasonEnum,
  flagStatusEnum,
  noteKindEnum,
  noteStatusEnum,
  verificationMethodEnum,
} from "./enums";
import { sources } from "./sources";
import { users } from "./users";

/**
 * Published community knowledge attached to an entity: experiences, tips,
 * common problems, fee/time reports, office updates. Notes go through
 * moderation (pending -> published) and can be confirmed by other users,
 * which powers "N contributors reported ..." trust signals.
 */
export const communityNotes = pgTable(
  "community_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entityType: entityTypeEnum("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    kind: noteKindEnum("kind").notNull(),
    /** Plain text / light Markdown body written by the contributor. */
    body: text("body").notNull(),
    /** When the reported experience happened, as stated by the contributor. */
    experiencedAt: timestamp("experienced_at", { withTimezone: true }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: noteStatusEnum("status").notNull().default("pending"),
    confirmCount: integer("confirm_count").notNull().default(0),
    moderatedById: uuid("moderated_by_id").references(() => users.id, { onDelete: "set null" }),
    moderatedAt: timestamp("moderated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("community_notes_entity_idx").on(t.entityType, t.entityId, t.status),
    index("community_notes_status_idx").on(t.status),
    index("community_notes_author_idx").on(t.authorId),
  ],
);

/** A user's confirmation of a community note ("this happened to me too"). */
export const noteConfirmations = pgTable(
  "note_confirmations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    noteId: uuid("note_id")
      .notNull()
      .references(() => communityNotes.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("note_confirmations_unique_idx").on(t.noteId, t.userId)],
);

/**
 * The moderation queue backbone. Every user submission — page edits, new
 * pages, documents, offices, experiences, corrections — is a contribution
 * that flows Submit -> Validation -> Moderation -> Review -> Publish.
 * The payload holds the structured proposal; revisionId links to the
 * revision store when the contribution proposes a content change.
 */
export const contributions = pgTable(
  "contributions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: contributionTypeEnum("type").notNull(),
    entityType: entityTypeEnum("entity_type"),
    entityId: uuid("entity_id"),
    revisionId: uuid("revision_id"),
    noteId: uuid("note_id").references(() => communityNotes.id, { onDelete: "set null" }),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    comment: text("comment"),
    status: contributionStatusEnum("status").notNull().default("pending"),
    reviewerId: uuid("reviewer_id").references(() => users.id, { onDelete: "set null" }),
    reviewNote: text("review_note"),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("contributions_status_idx").on(t.status, t.createdAt),
    index("contributions_user_idx").on(t.userId),
    index("contributions_entity_idx").on(t.entityType, t.entityId),
  ],
);

/**
 * Problem reports (flags) raised against content: incorrect/outdated info,
 * fake documents, wrong locations/fees, broken links, duplicates, copyright.
 * Every flag enters the moderation workflow.
 */
export const flags = pgTable(
  "flags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entityType: entityTypeEnum("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    reason: flagReasonEnum("reason").notNull(),
    details: text("details"),
    reporterId: uuid("reporter_id").references(() => users.id, { onDelete: "set null" }),
    status: flagStatusEnum("status").notNull().default("open"),
    resolverId: uuid("resolver_id").references(() => users.id, { onDelete: "set null" }),
    resolutionNote: text("resolution_note"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("flags_status_idx").on(t.status, t.createdAt),
    index("flags_entity_idx").on(t.entityType, t.entityId),
  ],
);

/**
 * Audit trail of verification events. The entity's verification_status and
 * last_verified_at fields are derived from these events by the verification
 * service; the log itself records who verified what, how, and against which
 * source.
 */
export const verifications = pgTable(
  "verifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    entityType: entityTypeEnum("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    verifiedById: uuid("verified_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    method: verificationMethodEnum("method").notNull(),
    sourceId: uuid("source_id").references(() => sources.id, { onDelete: "set null" }),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("verifications_entity_idx").on(t.entityType, t.entityId)],
);
