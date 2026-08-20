"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/action-result";
import { requirePermission } from "@/lib/auth/session";
import { enforceRateLimit } from "@/lib/rate-limit";
import { runAction, parseOrThrow } from "@/lib/safe-action";
import {
  proposeNewPage,
  proposePageEdit,
  submitDocument,
  submitFlag,
} from "@/lib/services/contributions";
import { confirmNote, submitNote } from "@/lib/services/notes";
import type { PageSnapshot } from "@/lib/services/pages";
import { ValidationError } from "@/lib/errors";
import { validateUpload } from "@/lib/storage";
import {
  documentSubmitSchema,
  flagSchema,
  newPageSchema,
  noteSchema,
  pageEditSchema,
} from "@/lib/validation/contributions";
import { z } from "zod";

function localized(en: string, am: string): Record<string, string> {
  return am ? { en, am } : { en };
}

/**
 * Suggest an edit to a knowledge page. Sections arrive as a JSON payload
 * from the structured editor; the resulting revision waits in the
 * moderation queue.
 */
export async function suggestEditAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  return runAction(async () => {
    const user = await requirePermission("contribution:create");
    enforceRateLimit("contribution", user.id);

    const pageSlug = z.string().min(1).max(200).parse(formData.get("pageSlug"));

    let sectionsRaw: unknown;
    try {
      sectionsRaw = JSON.parse(String(formData.get("sections") ?? "[]"));
    } catch {
      throw new ValidationError("The sections payload is malformed.");
    }

    const input = parseOrThrow(pageEditSchema, {
      titleEn: formData.get("titleEn"),
      titleAm: formData.get("titleAm") ?? "",
      summaryEn: formData.get("summaryEn"),
      summaryAm: formData.get("summaryAm") ?? "",
      sections: sectionsRaw,
      changeReason: formData.get("changeReason"),
    });

    const snapshot: PageSnapshot = {
      title: localized(input.titleEn, input.titleAm),
      summary: localized(input.summaryEn, input.summaryAm),
      sections: input.sections.map((s) => ({
        heading: localized(s.headingEn, s.headingAm),
        body: localized(s.bodyEn, s.bodyAm),
        layer: s.layer,
      })),
    };

    await proposePageEdit({
      pageSlug,
      snapshot,
      changeReason: input.changeReason,
      userId: user.id,
    });
    revalidatePath(`/pages/${pageSlug}`);
    return {
      ok: true,
      message: "Your edit was submitted for review. Thank you for contributing.",
      redirectTo: `/pages/${pageSlug}?submitted=edit`,
    };
  });
}

export async function createPageAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  return runAction(async () => {
    const user = await requirePermission("contribution:create");
    enforceRateLimit("contribution", user.id);
    const input = parseOrThrow(newPageSchema, {
      title: formData.get("title"),
      titleAm: formData.get("titleAm") ?? "",
      summary: formData.get("summary"),
      body: formData.get("body"),
      categoryId: formData.get("categoryId") ?? "",
      changeReason: formData.get("changeReason"),
    });
    await proposeNewPage({
      title: input.title,
      titleAm: input.titleAm || undefined,
      summary: input.summary,
      body: input.body,
      categoryId: input.categoryId || undefined,
      changeReason: input.changeReason,
      userId: user.id,
    });
    return {
      ok: true,
      message: "Your page was submitted for review.",
      redirectTo: "/account?submitted=page",
    };
  });
}

export async function submitExperienceAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  return runAction(async () => {
    const user = await requirePermission("contribution:create");
    enforceRateLimit("contribution", user.id);
    const input = parseOrThrow(noteSchema, {
      entityType: formData.get("entityType"),
      entityId: formData.get("entityId"),
      kind: formData.get("kind"),
      body: formData.get("body"),
      experiencedAt: formData.get("experiencedAt") || undefined,
    });
    await submitNote({
      entityType: input.entityType,
      entityId: input.entityId,
      kind: input.kind,
      body: input.body,
      experiencedAt: input.experiencedAt ? new Date(input.experiencedAt) : undefined,
      authorId: user.id,
    });
    return {
      ok: true,
      message: "Thank you. Your report will appear after moderation.",
    };
  });
}

export async function confirmNoteAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  return runAction(async () => {
    const user = await requirePermission("contribution:create");
    enforceRateLimit("contribution", user.id);
    const noteId = z.string().uuid().parse(formData.get("noteId"));
    await confirmNote({ noteId, userId: user.id });
    return { ok: true, message: "Confirmation recorded." };
  });
}

export async function reportProblemAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  return runAction(async () => {
    const user = await requirePermission("contribution:create");
    enforceRateLimit("flag", user.id);
    const input = parseOrThrow(flagSchema, {
      entityType: formData.get("entityType"),
      entityId: formData.get("entityId"),
      reason: formData.get("reason"),
      details: formData.get("details") || undefined,
    });
    await submitFlag({
      entityType: input.entityType,
      entityId: input.entityId,
      reason: input.reason,
      details: input.details,
      reporterId: user.id,
    });
    return {
      ok: true,
      message: "Report received. A moderator will review it.",
    };
  });
}

export async function submitDocumentAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  return runAction(async () => {
    const user = await requirePermission("contribution:create");
    enforceRateLimit("upload", user.id);
    const input = parseOrThrow(documentSubmitSchema, {
      title: formData.get("title"),
      description: formData.get("description"),
      categoryId: formData.get("categoryId") ?? "",
      docType: formData.get("docType"),
      language: formData.get("language"),
      layer: formData.get("layer"),
      sourceUrl: formData.get("sourceUrl") ?? "",
    });

    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new ValidationError("Attach a file.", { file: ["Attach a file."] });
    }
    const upload = await validateUpload(file);

    await submitDocument({
      title: input.title,
      description: input.description,
      categoryId: input.categoryId || undefined,
      docType: input.docType,
      language: input.language,
      layer: input.layer,
      sourceUrl: input.sourceUrl || undefined,
      upload,
      originalFilename: file.name,
      userId: user.id,
    });
    return {
      ok: true,
      message: "Document submitted. It will appear in the archive after review.",
      redirectTo: "/account?submitted=document",
    };
  });
}
