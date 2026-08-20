import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { LocalizedText } from "@/lib/i18n";
import {
  claimKindEnum,
  contentStatusEnum,
  infoLayerEnum,
  processComplexityEnum,
  verificationStatusEnum,
} from "./enums";
import { locations } from "./locations";
import { governmentOffices } from "./offices";
import { sources } from "./sources";
import { categories } from "./taxonomy";
import { users } from "./users";
import { documents } from "./documents";

/**
 * An administrative process (e.g. "Create a PLC in Ethiopia"). Overview,
 * official procedure and practical guide are separated; steps, documents,
 * fees and durations live in child tables so each claim can carry its own
 * information layer and sources.
 */
export const processes = pgTable(
  "processes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    title: jsonb("title").$type<LocalizedText>().notNull(),
    summary: jsonb("summary").$type<LocalizedText>().notNull(),
    /** What this process is / who needs it / when you need it (Markdown). */
    whoNeedsIt: jsonb("who_needs_it").$type<LocalizedText>(),
    whenNeeded: jsonb("when_needed").$type<LocalizedText>(),
    complexity: processComplexityEnum("complexity").notNull().default("moderate"),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    locationId: uuid("location_id").references(() => locations.id, { onDelete: "set null" }),
    /** Official procedure overview derived from official sources (Markdown). */
    officialProcedure: jsonb("official_procedure").$type<LocalizedText>(),
    /** Community-maintained practical guide (Markdown). */
    practicalGuide: jsonb("practical_guide").$type<LocalizedText>(),
    status: contentStatusEnum("status").notNull().default("draft"),
    verificationStatus: verificationStatusEnum("verification_status").notNull().default("unknown"),
    lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
    createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),
    currentRevisionNumber: integer("current_revision_number").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("processes_status_idx").on(t.status),
    index("processes_category_idx").on(t.categoryId),
    index("processes_location_idx").on(t.locationId),
    index("processes_updated_idx").on(t.updatedAt),
  ],
);

export const processSteps = pgTable(
  "process_steps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    processId: uuid("process_id")
      .notNull()
      .references(() => processes.id, { onDelete: "cascade" }),
    stepNumber: integer("step_number").notNull(),
    title: jsonb("title").$type<LocalizedText>().notNull(),
    /** What the official procedure says about this step (Markdown). */
    officialBody: jsonb("official_body").$type<LocalizedText>(),
    /** What the community reports about this step in practice (Markdown). */
    communityBody: jsonb("community_body").$type<LocalizedText>(),
    /** Office where this step is completed, when known. */
    officeId: uuid("office_id").references(() => governmentOffices.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("process_steps_process_idx").on(t.processId, t.stepNumber)],
);

/**
 * A document required (or reported as requested) for a process/step.
 * `layer = official` means an official source lists it; `community` means
 * contributors reported being asked for it.
 */
export const processRequirements = pgTable(
  "process_requirements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    processId: uuid("process_id")
      .notNull()
      .references(() => processes.id, { onDelete: "cascade" }),
    stepId: uuid("step_id").references(() => processSteps.id, { onDelete: "cascade" }),
    name: jsonb("name").$type<LocalizedText>().notNull(),
    required: boolean("required").notNull().default(true),
    layer: infoLayerEnum("layer").notNull(),
    whereToObtain: jsonb("where_to_obtain").$type<LocalizedText>(),
    /** Link into the document archive when the form/template is available. */
    documentId: uuid("document_id").references(() => documents.id, { onDelete: "set null" }),
    sourceId: uuid("source_id").references(() => sources.id, { onDelete: "set null" }),
    /** Number of distinct community reports backing a community-layer requirement. */
    reportCount: integer("report_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("process_requirements_process_idx").on(t.processId)],
);

/**
 * Fee claims. kind = official (published fee, must cite source),
 * community_reported (what people actually paid), or unknown.
 * Fees are never invented: unknown fees are stored as kind = unknown
 * with a null amount.
 */
export const processFees = pgTable(
  "process_fees",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    processId: uuid("process_id")
      .notNull()
      .references(() => processes.id, { onDelete: "cascade" }),
    stepId: uuid("step_id").references(() => processSteps.id, { onDelete: "cascade" }),
    label: jsonb("label").$type<LocalizedText>().notNull(),
    kind: claimKindEnum("kind").notNull(),
    amountMin: numeric("amount_min", { precision: 12, scale: 2 }),
    amountMax: numeric("amount_max", { precision: 12, scale: 2 }),
    currency: text("currency").notNull().default("ETB"),
    sourceId: uuid("source_id").references(() => sources.id, { onDelete: "set null" }),
    reportCount: integer("report_count").notNull().default(0),
    note: jsonb("note").$type<LocalizedText>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("process_fees_process_idx").on(t.processId)],
);

/** Processing time claims, same official/community/unknown discipline as fees. */
export const processDurations = pgTable(
  "process_durations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    processId: uuid("process_id")
      .notNull()
      .references(() => processes.id, { onDelete: "cascade" }),
    stepId: uuid("step_id").references(() => processSteps.id, { onDelete: "cascade" }),
    label: jsonb("label").$type<LocalizedText>().notNull(),
    kind: claimKindEnum("kind").notNull(),
    /** Human-readable duration, e.g. "1–3 working days". */
    duration: jsonb("duration").$type<LocalizedText>(),
    sourceId: uuid("source_id").references(() => sources.id, { onDelete: "set null" }),
    reportCount: integer("report_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("process_durations_process_idx").on(t.processId)],
);
