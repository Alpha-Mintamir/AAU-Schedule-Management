import { z } from "zod";

export const approveContributionSchema = z.object({
  contributionId: z.string().uuid(),
  reviewNote: z.string().trim().max(1000).optional(),
});

export const rejectContributionSchema = z.object({
  contributionId: z.string().uuid(),
  reviewNote: z
    .string()
    .trim()
    .min(5, "Explain the reason for rejection so the contributor can improve.")
    .max(1000),
  needsClarification: z.boolean().optional(),
});

export const resolveFlagSchema = z.object({
  flagId: z.string().uuid(),
  resolution: z.enum(["resolved", "dismissed"]),
  resolutionNote: z.string().trim().max(1000).optional(),
});

export const verifyEntitySchema = z.object({
  entityType: z.enum(["knowledge_page", "process", "office", "document"]),
  entityId: z.string().uuid(),
  method: z.enum([
    "official_source_check",
    "community_confirmation",
    "moderator_review",
    "in_person_check",
  ]),
  note: z.string().trim().max(1000).optional(),
});

export const markStateSchema = z.object({
  entityType: z.enum(["knowledge_page", "process", "office", "document"]),
  entityId: z.string().uuid(),
  status: z.enum(["outdated", "disputed"]),
  note: z.string().trim().max(1000).optional(),
});

export const revertRevisionSchema = z.object({
  revisionId: z.string().uuid(),
  reason: z.string().trim().min(5, "Explain why you are reverting.").max(500),
});

export const setRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["contributor", "trusted_contributor", "reviewer", "moderator", "admin"]),
});

export const setUserStatusSchema = z.object({
  userId: z.string().uuid(),
  status: z.enum(["active", "suspended", "banned"]),
});
