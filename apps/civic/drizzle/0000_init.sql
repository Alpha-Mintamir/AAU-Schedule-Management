CREATE TYPE "public"."claim_kind" AS ENUM('official', 'community_reported', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."content_status" AS ENUM('draft', 'in_review', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."contribution_status" AS ENUM('pending', 'in_review', 'approved', 'rejected', 'needs_clarification');--> statement-breakpoint
CREATE TYPE "public"."contribution_type" AS ENUM('edit_page', 'create_page', 'submit_official_info', 'submit_document', 'report_outdated', 'add_office', 'add_experience', 'add_source', 'correction', 'office_report');--> statement-breakpoint
CREATE TYPE "public"."document_access" AS ENUM('public', 'moderated_public', 'private_contributor', 'restricted_admin');--> statement-breakpoint
CREATE TYPE "public"."entity_type" AS ENUM('knowledge_page', 'process', 'office', 'document', 'organization', 'location');--> statement-breakpoint
CREATE TYPE "public"."flag_reason" AS ENUM('incorrect_information', 'outdated_information', 'fake_document', 'wrong_office_location', 'wrong_fees', 'broken_link', 'misleading_information', 'duplicate_page', 'copyright_issue', 'spam_or_abuse', 'other');--> statement-breakpoint
CREATE TYPE "public"."flag_status" AS ENUM('open', 'in_review', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."info_layer" AS ENUM('official', 'community');--> statement-breakpoint
CREATE TYPE "public"."location_type" AS ENUM('country', 'region', 'city', 'subcity', 'woreda');--> statement-breakpoint
CREATE TYPE "public"."note_kind" AS ENUM('experience', 'tip', 'problem', 'fee_report', 'time_report', 'document_report', 'office_update', 'correction');--> statement-breakpoint
CREATE TYPE "public"."note_status" AS ENUM('pending', 'published', 'rejected', 'hidden');--> statement-breakpoint
CREATE TYPE "public"."process_complexity" AS ENUM('simple', 'moderate', 'complex', 'very_complex');--> statement-breakpoint
CREATE TYPE "public"."revision_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."source_reliability" AS ENUM('official', 'reliable', 'community', 'unverified');--> statement-breakpoint
CREATE TYPE "public"."source_type" AS ENUM('government_website', 'government_pdf', 'official_portal', 'law_or_regulation', 'official_announcement', 'community_submission', 'external_reference');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('contributor', 'trusted_contributor', 'reviewer', 'moderator', 'admin');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'suspended', 'banned');--> statement-breakpoint
CREATE TYPE "public"."verification_method" AS ENUM('official_source_check', 'community_confirmation', 'moderator_review', 'in_person_check');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('official', 'officially_verified', 'community_verified', 'community_reported', 'outdated', 'disputed', 'unknown');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" text NOT NULL,
	"entity_type" text,
	"entity_id" uuid,
	"metadata" text,
	"ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" text NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_agent" text,
	"revoked" boolean DEFAULT false NOT NULL,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"role" "user_role" DEFAULT 'contributor' NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"reputation" integer DEFAULT 0 NOT NULL,
	"bio" text,
	"email_verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "location_type" NOT NULL,
	"parent_id" uuid,
	"slug" text NOT NULL,
	"name" jsonb NOT NULL,
	"description" jsonb,
	"latitude" double precision,
	"longitude" double precision,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "locations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "citations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"entity_type" "entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"anchor" text,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text,
	"title" text NOT NULL,
	"organization" text,
	"type" "source_type" NOT NULL,
	"reliability" "source_reliability" DEFAULT 'unverified' NOT NULL,
	"published_at" timestamp with time zone,
	"retrieved_at" timestamp with time zone,
	"version" text,
	"notes" text,
	"added_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" jsonb NOT NULL,
	"description" jsonb,
	"icon" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "entity_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_type" "entity_type" NOT NULL,
	"from_id" uuid NOT NULL,
	"to_type" "entity_type" NOT NULL,
	"to_id" uuid NOT NULL,
	"relation" text DEFAULT 'related' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entity_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tag_id" uuid NOT NULL,
	"entity_type" "entity_type" NOT NULL,
	"entity_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "knowledge_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" jsonb NOT NULL,
	"summary" jsonb NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"verification_status" "verification_status" DEFAULT 'unknown' NOT NULL,
	"last_verified_at" timestamp with time zone,
	"category_id" uuid,
	"location_id" uuid,
	"created_by_id" uuid,
	"current_revision_number" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "knowledge_pages_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "page_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"heading" jsonb NOT NULL,
	"body" jsonb NOT NULL,
	"layer" "info_layer" DEFAULT 'community' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" "entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"revision_number" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	"previous_snapshot" jsonb,
	"author_id" uuid,
	"change_reason" text NOT NULL,
	"status" "revision_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by_id" uuid,
	"reviewed_at" timestamp with time zone,
	"review_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "government_offices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" jsonb NOT NULL,
	"organization_id" uuid,
	"office_type" text,
	"location_id" uuid,
	"address" jsonb,
	"latitude" double precision,
	"longitude" double precision,
	"phone" text,
	"email" text,
	"website" text,
	"opening_hours" jsonb,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"verification_status" "verification_status" DEFAULT 'unknown' NOT NULL,
	"last_verified_at" timestamp with time zone,
	"official_source_id" uuid,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "government_offices_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "government_organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" jsonb NOT NULL,
	"org_type" text NOT NULL,
	"description" jsonb,
	"website" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "government_organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "office_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"office_id" uuid NOT NULL,
	"name" jsonb NOT NULL,
	"description" jsonb,
	"layer" "info_layer" DEFAULT 'official' NOT NULL,
	"source_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"storage_key" text NOT NULL,
	"original_filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"format" text NOT NULL,
	"file_size" integer NOT NULL,
	"sha256" text NOT NULL,
	"change_note" text,
	"uploaded_by_id" uuid,
	"scan_status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" jsonb NOT NULL,
	"description" jsonb,
	"category_id" uuid,
	"language" text DEFAULT 'am' NOT NULL,
	"doc_type" text NOT NULL,
	"layer" "info_layer" NOT NULL,
	"issuing_organization_id" uuid,
	"version" text,
	"published_date" timestamp with time zone,
	"source_id" uuid,
	"license" text,
	"access" "document_access" DEFAULT 'moderated_public' NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"verification_status" "verification_status" DEFAULT 'unknown' NOT NULL,
	"last_verified_at" timestamp with time zone,
	"contributor_id" uuid,
	"current_version_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "documents_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "process_durations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"process_id" uuid NOT NULL,
	"step_id" uuid,
	"label" jsonb NOT NULL,
	"kind" "claim_kind" NOT NULL,
	"duration" jsonb,
	"source_id" uuid,
	"report_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "process_fees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"process_id" uuid NOT NULL,
	"step_id" uuid,
	"label" jsonb NOT NULL,
	"kind" "claim_kind" NOT NULL,
	"amount_min" numeric(12, 2),
	"amount_max" numeric(12, 2),
	"currency" text DEFAULT 'ETB' NOT NULL,
	"source_id" uuid,
	"report_count" integer DEFAULT 0 NOT NULL,
	"note" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "process_requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"process_id" uuid NOT NULL,
	"step_id" uuid,
	"name" jsonb NOT NULL,
	"required" boolean DEFAULT true NOT NULL,
	"layer" "info_layer" NOT NULL,
	"where_to_obtain" jsonb,
	"document_id" uuid,
	"source_id" uuid,
	"report_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "process_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"process_id" uuid NOT NULL,
	"step_number" integer NOT NULL,
	"title" jsonb NOT NULL,
	"official_body" jsonb,
	"community_body" jsonb,
	"office_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "processes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" jsonb NOT NULL,
	"summary" jsonb NOT NULL,
	"who_needs_it" jsonb,
	"when_needed" jsonb,
	"complexity" "process_complexity" DEFAULT 'moderate' NOT NULL,
	"category_id" uuid,
	"location_id" uuid,
	"official_procedure" jsonb,
	"practical_guide" jsonb,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"verification_status" "verification_status" DEFAULT 'unknown' NOT NULL,
	"last_verified_at" timestamp with time zone,
	"created_by_id" uuid,
	"current_revision_number" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "processes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "community_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" "entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"kind" "note_kind" NOT NULL,
	"body" text NOT NULL,
	"experienced_at" timestamp with time zone,
	"author_id" uuid NOT NULL,
	"status" "note_status" DEFAULT 'pending' NOT NULL,
	"confirm_count" integer DEFAULT 0 NOT NULL,
	"moderated_by_id" uuid,
	"moderated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "contribution_type" NOT NULL,
	"entity_type" "entity_type",
	"entity_id" uuid,
	"revision_id" uuid,
	"note_id" uuid,
	"payload" jsonb NOT NULL,
	"comment" text,
	"status" "contribution_status" DEFAULT 'pending' NOT NULL,
	"reviewer_id" uuid,
	"review_note" text,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" "entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"reason" "flag_reason" NOT NULL,
	"details" text,
	"reporter_id" uuid,
	"status" "flag_status" DEFAULT 'open' NOT NULL,
	"resolver_id" uuid,
	"resolution_note" text,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "note_confirmations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"note_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" "entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"verified_by_id" uuid NOT NULL,
	"method" "verification_method" NOT NULL,
	"source_id" uuid,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "search_aliases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" "entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"alias" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "search_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" "entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"slug" text NOT NULL,
	"url" text NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"body" text,
	"keywords" text,
	"verification_status" "verification_status" DEFAULT 'unknown' NOT NULL,
	"facets" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_parent_id_locations_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citations" ADD CONSTRAINT "citations_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_added_by_id_users_id_fk" FOREIGN KEY ("added_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_tags" ADD CONSTRAINT "entity_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_pages" ADD CONSTRAINT "knowledge_pages_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_pages" ADD CONSTRAINT "knowledge_pages_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_pages" ADD CONSTRAINT "knowledge_pages_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_sections" ADD CONSTRAINT "page_sections_page_id_knowledge_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."knowledge_pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revisions" ADD CONSTRAINT "revisions_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "revisions" ADD CONSTRAINT "revisions_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "government_offices" ADD CONSTRAINT "government_offices_organization_id_government_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."government_organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "government_offices" ADD CONSTRAINT "government_offices_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "government_offices" ADD CONSTRAINT "government_offices_official_source_id_sources_id_fk" FOREIGN KEY ("official_source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "government_offices" ADD CONSTRAINT "government_offices_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "office_services" ADD CONSTRAINT "office_services_office_id_government_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "public"."government_offices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "office_services" ADD CONSTRAINT "office_services_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_issuing_organization_id_government_organizations_id_fk" FOREIGN KEY ("issuing_organization_id") REFERENCES "public"."government_organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_contributor_id_users_id_fk" FOREIGN KEY ("contributor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "process_durations" ADD CONSTRAINT "process_durations_process_id_processes_id_fk" FOREIGN KEY ("process_id") REFERENCES "public"."processes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "process_durations" ADD CONSTRAINT "process_durations_step_id_process_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."process_steps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "process_durations" ADD CONSTRAINT "process_durations_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "process_fees" ADD CONSTRAINT "process_fees_process_id_processes_id_fk" FOREIGN KEY ("process_id") REFERENCES "public"."processes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "process_fees" ADD CONSTRAINT "process_fees_step_id_process_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."process_steps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "process_fees" ADD CONSTRAINT "process_fees_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "process_requirements" ADD CONSTRAINT "process_requirements_process_id_processes_id_fk" FOREIGN KEY ("process_id") REFERENCES "public"."processes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "process_requirements" ADD CONSTRAINT "process_requirements_step_id_process_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."process_steps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "process_requirements" ADD CONSTRAINT "process_requirements_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "process_requirements" ADD CONSTRAINT "process_requirements_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "process_steps" ADD CONSTRAINT "process_steps_process_id_processes_id_fk" FOREIGN KEY ("process_id") REFERENCES "public"."processes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "process_steps" ADD CONSTRAINT "process_steps_office_id_government_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "public"."government_offices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processes" ADD CONSTRAINT "processes_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processes" ADD CONSTRAINT "processes_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processes" ADD CONSTRAINT "processes_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_notes" ADD CONSTRAINT "community_notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_notes" ADD CONSTRAINT "community_notes_moderated_by_id_users_id_fk" FOREIGN KEY ("moderated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_note_id_community_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."community_notes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contributions" ADD CONSTRAINT "contributions_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flags" ADD CONSTRAINT "flags_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flags" ADD CONSTRAINT "flags_resolver_id_users_id_fk" FOREIGN KEY ("resolver_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_confirmations" ADD CONSTRAINT "note_confirmations_note_id_community_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."community_notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_confirmations" ADD CONSTRAINT "note_confirmations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_verified_by_id_users_id_fk" FOREIGN KEY ("verified_by_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_user_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_status_idx" ON "users" USING btree ("status");--> statement-breakpoint
CREATE INDEX "locations_parent_idx" ON "locations" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "locations_type_idx" ON "locations" USING btree ("type");--> statement-breakpoint
CREATE INDEX "citations_entity_idx" ON "citations" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "citations_unique_idx" ON "citations" USING btree ("source_id","entity_type","entity_id","anchor");--> statement-breakpoint
CREATE INDEX "sources_type_idx" ON "sources" USING btree ("type");--> statement-breakpoint
CREATE INDEX "sources_reliability_idx" ON "sources" USING btree ("reliability");--> statement-breakpoint
CREATE INDEX "entity_links_from_idx" ON "entity_links" USING btree ("from_type","from_id");--> statement-breakpoint
CREATE INDEX "entity_links_to_idx" ON "entity_links" USING btree ("to_type","to_id");--> statement-breakpoint
CREATE UNIQUE INDEX "entity_links_unique_idx" ON "entity_links" USING btree ("from_type","from_id","to_type","to_id","relation");--> statement-breakpoint
CREATE UNIQUE INDEX "entity_tags_unique_idx" ON "entity_tags" USING btree ("tag_id","entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "entity_tags_entity_idx" ON "entity_tags" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "knowledge_pages_status_idx" ON "knowledge_pages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "knowledge_pages_category_idx" ON "knowledge_pages" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "knowledge_pages_location_idx" ON "knowledge_pages" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "knowledge_pages_verification_idx" ON "knowledge_pages" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX "knowledge_pages_updated_idx" ON "knowledge_pages" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "page_sections_page_idx" ON "page_sections" USING btree ("page_id","sort_order");--> statement-breakpoint
CREATE INDEX "revisions_entity_idx" ON "revisions" USING btree ("entity_type","entity_id","revision_number");--> statement-breakpoint
CREATE INDEX "revisions_status_idx" ON "revisions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "revisions_unique_number_idx" ON "revisions" USING btree ("entity_type","entity_id","revision_number");--> statement-breakpoint
CREATE INDEX "offices_location_idx" ON "government_offices" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "offices_org_idx" ON "government_offices" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "offices_status_idx" ON "government_offices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "office_services_office_idx" ON "office_services" USING btree ("office_id");--> statement-breakpoint
CREATE INDEX "document_versions_document_idx" ON "document_versions" USING btree ("document_id","version_number");--> statement-breakpoint
CREATE INDEX "documents_category_idx" ON "documents" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "documents_status_idx" ON "documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "documents_layer_idx" ON "documents" USING btree ("layer");--> statement-breakpoint
CREATE INDEX "documents_updated_idx" ON "documents" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "process_durations_process_idx" ON "process_durations" USING btree ("process_id");--> statement-breakpoint
CREATE INDEX "process_fees_process_idx" ON "process_fees" USING btree ("process_id");--> statement-breakpoint
CREATE INDEX "process_requirements_process_idx" ON "process_requirements" USING btree ("process_id");--> statement-breakpoint
CREATE INDEX "process_steps_process_idx" ON "process_steps" USING btree ("process_id","step_number");--> statement-breakpoint
CREATE INDEX "processes_status_idx" ON "processes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "processes_category_idx" ON "processes" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "processes_location_idx" ON "processes" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "processes_updated_idx" ON "processes" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "community_notes_entity_idx" ON "community_notes" USING btree ("entity_type","entity_id","status");--> statement-breakpoint
CREATE INDEX "community_notes_status_idx" ON "community_notes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "community_notes_author_idx" ON "community_notes" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "contributions_status_idx" ON "contributions" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "contributions_user_idx" ON "contributions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "contributions_entity_idx" ON "contributions" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "flags_status_idx" ON "flags" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "flags_entity_idx" ON "flags" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "note_confirmations_unique_idx" ON "note_confirmations" USING btree ("note_id","user_id");--> statement-breakpoint
CREATE INDEX "verifications_entity_idx" ON "verifications" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "search_aliases_entity_idx" ON "search_aliases" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "search_aliases_unique_idx" ON "search_aliases" USING btree ("entity_type","entity_id","alias");--> statement-breakpoint
CREATE UNIQUE INDEX "search_documents_entity_locale_idx" ON "search_documents" USING btree ("entity_type","entity_id","locale");--> statement-breakpoint
CREATE INDEX "search_documents_type_idx" ON "search_documents" USING btree ("entity_type");