"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/action-result";
import { requirePermission } from "@/lib/auth/session";
import { runAction, parseOrThrow } from "@/lib/safe-action";
import {
  approveContribution,
  rejectContribution,
  resolveFlag,
  revertToRevision,
} from "@/lib/services/moderation";
import { markVerificationState, recordVerification } from "@/lib/services/verification";
import {
  approveContributionSchema,
  markStateSchema,
  rejectContributionSchema,
  resolveFlagSchema,
  revertRevisionSchema,
  verifyEntitySchema,
} from "@/lib/validation/moderation";

function revalidateModeration(): void {
  revalidatePath("/moderation");
  revalidatePath("/admin");
}

export async function approveContributionAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  return runAction(async () => {
    const reviewer = await requirePermission("moderation:review_contributions");
    const input = parseOrThrow(approveContributionSchema, {
      contributionId: formData.get("contributionId"),
      reviewNote: formData.get("reviewNote") || undefined,
    });
    await approveContribution({
      contributionId: input.contributionId,
      reviewerId: reviewer.id,
      reviewNote: input.reviewNote,
    });
    revalidateModeration();
    return { ok: true, message: "Contribution approved and published." };
  });
}

export async function rejectContributionAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  return runAction(async () => {
    const reviewer = await requirePermission("moderation:review_contributions");
    const input = parseOrThrow(rejectContributionSchema, {
      contributionId: formData.get("contributionId"),
      reviewNote: formData.get("reviewNote"),
      needsClarification: formData.get("needsClarification") === "on",
    });
    await rejectContribution({
      contributionId: input.contributionId,
      reviewerId: reviewer.id,
      reviewNote: input.reviewNote,
      needsClarification: input.needsClarification,
    });
    revalidateModeration();
    return { ok: true, message: "Contribution rejected." };
  });
}

export async function resolveFlagAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  return runAction(async () => {
    const moderator = await requirePermission("moderation:resolve_flags");
    const input = parseOrThrow(resolveFlagSchema, {
      flagId: formData.get("flagId"),
      resolution: formData.get("resolution"),
      resolutionNote: formData.get("resolutionNote") || undefined,
    });
    await resolveFlag({
      flagId: input.flagId,
      resolverId: moderator.id,
      resolution: input.resolution,
      resolutionNote: input.resolutionNote,
    });
    revalidateModeration();
    return { ok: true, message: "Report handled." };
  });
}

export async function verifyEntityAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  return runAction(async () => {
    const reviewer = await requirePermission("moderation:verify_content");
    const input = parseOrThrow(verifyEntitySchema, {
      entityType: formData.get("entityType"),
      entityId: formData.get("entityId"),
      method: formData.get("method"),
      note: formData.get("note") || undefined,
    });
    await recordVerification({
      entityType: input.entityType,
      entityId: input.entityId,
      verifiedById: reviewer.id,
      method: input.method,
      note: input.note,
    });
    revalidateModeration();
    return { ok: true, message: "Verification recorded." };
  });
}

export async function markStateAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  return runAction(async () => {
    const moderator = await requirePermission("moderation:mark_outdated");
    const input = parseOrThrow(markStateSchema, {
      entityType: formData.get("entityType"),
      entityId: formData.get("entityId"),
      status: formData.get("status"),
      note: formData.get("note") || undefined,
    });
    await markVerificationState({
      entityType: input.entityType,
      entityId: input.entityId,
      status: input.status,
      actorId: moderator.id,
      note: input.note,
    });
    revalidateModeration();
    return { ok: true, message: `Marked as ${input.status}.` };
  });
}

export async function revertRevisionAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  return runAction(async () => {
    const moderator = await requirePermission("moderation:revert_revisions");
    const input = parseOrThrow(revertRevisionSchema, {
      revisionId: formData.get("revisionId"),
      reason: formData.get("reason"),
    });
    await revertToRevision({
      revisionId: input.revisionId,
      moderatorId: moderator.id,
      reason: input.reason,
    });
    revalidateModeration();
    return { ok: true, message: "Page reverted to the selected revision." };
  });
}
