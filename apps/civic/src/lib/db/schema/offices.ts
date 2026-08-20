import {
  doublePrecision,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { LocalizedText } from "@/lib/i18n";
import { contentStatusEnum, infoLayerEnum, verificationStatusEnum } from "./enums";
import { locations } from "./locations";
import { sources } from "./sources";
import { users } from "./users";

export const governmentOrganizations = pgTable(
  "government_organizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: jsonb("name").$type<LocalizedText>().notNull(),
    /** e.g. federal ministry, city bureau, authority, agency */
    orgType: text("org_type").notNull(),
    description: jsonb("description").$type<LocalizedText>(),
    website: text("website"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
);

/** Opening hours as structured data so they can be rendered and localized. */
export interface OpeningHours {
  /** e.g. { "mon-fri": "8:30–17:00", "sat": "8:30–12:00" } */
  [days: string]: string;
}

export const governmentOffices = pgTable(
  "government_offices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    name: jsonb("name").$type<LocalizedText>().notNull(),
    organizationId: uuid("organization_id").references(() => governmentOrganizations.id, {
      onDelete: "set null",
    }),
    /** e.g. branch office, head office, service center */
    officeType: text("office_type"),
    /** Most specific known location node (woreda, sub-city, or city). */
    locationId: uuid("location_id").references(() => locations.id, { onDelete: "set null" }),
    address: jsonb("address").$type<LocalizedText>(),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    phone: text("phone"),
    email: text("email"),
    website: text("website"),
    openingHours: jsonb("opening_hours").$type<OpeningHours>(),
    status: contentStatusEnum("status").notNull().default("draft"),
    verificationStatus: verificationStatusEnum("verification_status").notNull().default("unknown"),
    lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
    officialSourceId: uuid("official_source_id").references(() => sources.id, {
      onDelete: "set null",
    }),
    createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("offices_location_idx").on(t.locationId),
    index("offices_org_idx").on(t.organizationId),
    index("offices_status_idx").on(t.status),
  ],
);

/**
 * A service an office provides. `layer` records whether the service listing
 * comes from an official source or a community report.
 */
export const officeServices = pgTable(
  "office_services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    officeId: uuid("office_id")
      .notNull()
      .references(() => governmentOffices.id, { onDelete: "cascade" }),
    name: jsonb("name").$type<LocalizedText>().notNull(),
    description: jsonb("description").$type<LocalizedText>(),
    layer: infoLayerEnum("layer").notNull().default("official"),
    sourceId: uuid("source_id").references(() => sources.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("office_services_office_idx").on(t.officeId)],
);
