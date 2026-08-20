import { pgEnum } from "drizzle-orm/pg-core";

/** RBAC roles. Permissions per role are defined centrally in lib/auth/permissions.ts. */
export const userRoleEnum = pgEnum("user_role", [
  "contributor",
  "trusted_contributor",
  "reviewer",
  "moderator",
  "admin",
]);

export const userStatusEnum = pgEnum("user_status", ["active", "suspended", "banned"]);

/** Editorial workflow for public content: Draft -> Review -> Approved -> Published. */
export const contentStatusEnum = pgEnum("content_status", [
  "draft",
  "in_review",
  "published",
  "archived",
]);

/**
 * Trust state of a piece of information. This is the core of the platform:
 * official government information is never conflated with community knowledge.
 */
export const verificationStatusEnum = pgEnum("verification_status", [
  "official",
  "officially_verified",
  "community_verified",
  "community_reported",
  "outdated",
  "disputed",
  "unknown",
]);

/** Which information layer a claim belongs to. Never merged into one authoritative claim. */
export const infoLayerEnum = pgEnum("info_layer", ["official", "community"]);

export const locationTypeEnum = pgEnum("location_type", [
  "country",
  "region",
  "city",
  "subcity",
  "woreda",
]);

export const sourceTypeEnum = pgEnum("source_type", [
  "government_website",
  "government_pdf",
  "official_portal",
  "law_or_regulation",
  "official_announcement",
  "community_submission",
  "external_reference",
]);

export const sourceReliabilityEnum = pgEnum("source_reliability", [
  "official",
  "reliable",
  "community",
  "unverified",
]);

export const entityTypeEnum = pgEnum("entity_type", [
  "knowledge_page",
  "process",
  "office",
  "document",
  "organization",
  "location",
]);

export const contributionTypeEnum = pgEnum("contribution_type", [
  "edit_page",
  "create_page",
  "submit_official_info",
  "submit_document",
  "report_outdated",
  "add_office",
  "add_experience",
  "add_source",
  "correction",
  "office_report",
]);

export const contributionStatusEnum = pgEnum("contribution_status", [
  "pending",
  "in_review",
  "approved",
  "rejected",
  "needs_clarification",
]);

export const revisionStatusEnum = pgEnum("revision_status", [
  "pending",
  "approved",
  "rejected",
]);

/** Published community knowledge attached to an entity. */
export const noteKindEnum = pgEnum("note_kind", [
  "experience",
  "tip",
  "problem",
  "fee_report",
  "time_report",
  "document_report",
  "office_update",
  "correction",
]);

export const noteStatusEnum = pgEnum("note_status", ["pending", "published", "rejected", "hidden"]);

export const flagReasonEnum = pgEnum("flag_reason", [
  "incorrect_information",
  "outdated_information",
  "fake_document",
  "wrong_office_location",
  "wrong_fees",
  "broken_link",
  "misleading_information",
  "duplicate_page",
  "copyright_issue",
  "spam_or_abuse",
  "other",
]);

export const flagStatusEnum = pgEnum("flag_status", ["open", "in_review", "resolved", "dismissed"]);

export const processComplexityEnum = pgEnum("process_complexity", [
  "simple",
  "moderate",
  "complex",
  "very_complex",
]);

/** Fee/time claims: officially published, community reported, or unknown. Never invented. */
export const claimKindEnum = pgEnum("claim_kind", ["official", "community_reported", "unknown"]);

export const documentAccessEnum = pgEnum("document_access", [
  "public",
  "moderated_public",
  "private_contributor",
  "restricted_admin",
]);

export const verificationMethodEnum = pgEnum("verification_method", [
  "official_source_check",
  "community_confirmation",
  "moderator_review",
  "in_person_check",
]);
