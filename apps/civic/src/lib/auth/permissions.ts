/**
 * Centralized RBAC authorization layer.
 *
 * All permission checks in the application go through `hasPermission` /
 * `requirePermission`. Role checks are never scattered through components or
 * routes — UI and services ask about *permissions*, not roles, so the role
 * model can evolve without touching call sites.
 */

export const USER_ROLES = [
  "contributor",
  "trusted_contributor",
  "reviewer",
  "moderator",
  "admin",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type Permission =
  // Contribution
  | "contribution:create"
  | "contribution:create_trusted"
  // Review & moderation
  | "moderation:review_contributions"
  | "moderation:moderate_notes"
  | "moderation:resolve_flags"
  | "moderation:verify_content"
  | "moderation:mark_outdated"
  | "moderation:revert_revisions"
  // Direct content management (bypasses the public queue; still creates revisions)
  | "content:publish"
  | "content:edit_direct"
  // Administration
  | "admin:access_dashboard"
  | "admin:manage_users"
  | "admin:manage_roles"
  | "admin:manage_taxonomy"
  | "admin:manage_locations"
  | "admin:manage_sources"
  | "admin:view_audit_logs";

const CONTRIBUTOR: Permission[] = ["contribution:create"];

const TRUSTED_CONTRIBUTOR: Permission[] = [...CONTRIBUTOR, "contribution:create_trusted"];

const REVIEWER: Permission[] = [
  ...TRUSTED_CONTRIBUTOR,
  "moderation:review_contributions",
  "moderation:moderate_notes",
  "moderation:verify_content",
];

const MODERATOR: Permission[] = [
  ...REVIEWER,
  "moderation:resolve_flags",
  "moderation:mark_outdated",
  "moderation:revert_revisions",
  "content:publish",
  "content:edit_direct",
];

const ADMIN: Permission[] = [
  ...MODERATOR,
  "admin:access_dashboard",
  "admin:manage_users",
  "admin:manage_roles",
  "admin:manage_taxonomy",
  "admin:manage_locations",
  "admin:manage_sources",
  "admin:view_audit_logs",
];

export const ROLE_PERMISSIONS: Record<UserRole, ReadonlySet<Permission>> = {
  contributor: new Set(CONTRIBUTOR),
  trusted_contributor: new Set(TRUSTED_CONTRIBUTOR),
  reviewer: new Set(REVIEWER),
  moderator: new Set(MODERATOR),
  admin: new Set(ADMIN),
};

export function hasPermission(role: UserRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}

/** Roles allowed to see the moderation area at all (navigation gating). */
export function canModerate(role: UserRole | null | undefined): boolean {
  return hasPermission(role, "moderation:review_contributions");
}

export const ROLE_LABELS: Record<UserRole, string> = {
  contributor: "Contributor",
  trusted_contributor: "Trusted Contributor",
  reviewer: "Reviewer",
  moderator: "Moderator",
  admin: "Administrator",
};
