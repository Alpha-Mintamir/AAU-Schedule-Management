import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import {
  contributions,
  documentVersions,
  documents,
  flags,
  knowledgePages,
  pageSections,
  revisions,
  type entityTypeEnum,
  type flagReasonEnum,
} from "@/lib/db/schema";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { slugify } from "@/lib/utils";
import { generateStorageKey, storage, type ValidatedUpload } from "@/lib/storage";
import { pageToSnapshot, type PageSnapshot } from "./pages";

type EntityType = (typeof entityTypeEnum.enumValues)[number];
type FlagReason = (typeof flagReasonEnum.enumValues)[number];

/**
 * Propose an edit to a knowledge page. Creates a pending revision holding
 * the proposed snapshot plus a contribution row for the moderation queue.
 * Nothing touches the live page until a reviewer approves.
 */
export async function proposePageEdit(input: {
  pageSlug: string;
  snapshot: PageSnapshot;
  changeReason: string;
  userId: string;
}): Promise<{ contributionId: string }> {
  const page = await db.query.knowledgePages.findFirst({
    where: eq(knowledgePages.slug, input.pageSlug),
  });
  if (!page) throw new NotFoundError("Page not found.");

  const sections = await db
    .select()
    .from(pageSections)
    .where(eq(pageSections.pageId, page.id));
  const previousSnapshot = pageToSnapshot(page, sections);

  return db.transaction(async (tx) => {
    const [{ maxNumber }] = await tx
      .select({ maxNumber: sql<number>`COALESCE(MAX(${revisions.revisionNumber}), 0)` })
      .from(revisions)
      .where(and(eq(revisions.entityType, "knowledge_page"), eq(revisions.entityId, page.id)));

    const [revision] = await tx
      .insert(revisions)
      .values({
        entityType: "knowledge_page",
        entityId: page.id,
        revisionNumber: Number(maxNumber) + 1,
        snapshot: input.snapshot,
        previousSnapshot,
        authorId: input.userId,
        changeReason: input.changeReason,
        status: "pending",
      })
      .returning({ id: revisions.id });

    const [contribution] = await tx
      .insert(contributions)
      .values({
        userId: input.userId,
        type: "edit_page",
        entityType: "knowledge_page",
        entityId: page.id,
        revisionId: revision.id,
        payload: { pageSlug: page.slug, changeReason: input.changeReason },
        status: "pending",
      })
      .returning({ id: contributions.id });

    await audit({
      userId: input.userId,
      action: "contribution.propose_edit",
      entityType: "knowledge_page",
      entityId: page.id,
      metadata: { revisionId: revision.id },
    });
    return { contributionId: contribution.id };
  });
}

/** Propose a brand-new knowledge page (created as draft, published on approval). */
export async function proposeNewPage(input: {
  title: string;
  titleAm?: string;
  summary: string;
  body: string;
  categoryId?: string;
  changeReason: string;
  userId: string;
}): Promise<{ contributionId: string }> {
  const baseSlug = slugify(input.title);
  if (!baseSlug) throw new ValidationError("The title must contain Latin characters for the URL.");

  const existing = await db.query.knowledgePages.findFirst({
    where: eq(knowledgePages.slug, baseSlug),
  });
  const slug = existing ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug;

  const snapshot: PageSnapshot = {
    title: input.titleAm ? { en: input.title, am: input.titleAm } : { en: input.title },
    summary: { en: input.summary },
    sections: [
      {
        heading: { en: "Overview" },
        body: { en: input.body },
        layer: "community",
      },
    ],
  };

  return db.transaction(async (tx) => {
    const [page] = await tx
      .insert(knowledgePages)
      .values({
        slug,
        title: snapshot.title,
        summary: snapshot.summary,
        status: "in_review",
        verificationStatus: "community_reported",
        categoryId: input.categoryId ?? null,
        createdById: input.userId,
      })
      .returning({ id: knowledgePages.id });

    const [revision] = await tx
      .insert(revisions)
      .values({
        entityType: "knowledge_page",
        entityId: page.id,
        revisionNumber: 1,
        snapshot,
        previousSnapshot: null,
        authorId: input.userId,
        changeReason: input.changeReason,
        status: "pending",
      })
      .returning({ id: revisions.id });

    const [contribution] = await tx
      .insert(contributions)
      .values({
        userId: input.userId,
        type: "create_page",
        entityType: "knowledge_page",
        entityId: page.id,
        revisionId: revision.id,
        payload: { slug, title: input.title },
        status: "pending",
      })
      .returning({ id: contributions.id });

    await audit({
      userId: input.userId,
      action: "contribution.propose_page",
      entityType: "knowledge_page",
      entityId: page.id,
    });
    return { contributionId: contribution.id };
  });
}

/**
 * Submit a document to the archive. The file has already passed
 * validateUpload (size, magic bytes, scan hook). The document is created in
 * review state and only becomes downloadable after moderation.
 */
export async function submitDocument(input: {
  title: string;
  description: string;
  categoryId?: string;
  docType: string;
  language: string;
  layer: "official" | "community";
  sourceUrl?: string;
  upload: ValidatedUpload;
  originalFilename: string;
  userId: string;
}): Promise<{ contributionId: string }> {
  const baseSlug = slugify(input.title);
  if (!baseSlug) throw new ValidationError("The title must contain Latin characters for the URL.");
  const existing = await db.query.documents.findFirst({ where: eq(documents.slug, baseSlug) });
  const slug = existing ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug;

  const storageKey = generateStorageKey(input.upload.format);
  await storage.put(storageKey, input.upload.data);

  try {
    return await db.transaction(async (tx) => {
      const [doc] = await tx
        .insert(documents)
        .values({
          slug,
          title: { en: input.title },
          description: { en: input.description },
          categoryId: input.categoryId ?? null,
          language: input.language,
          docType: input.docType,
          layer: input.layer,
          access: "moderated_public",
          status: "in_review",
          // Even a claimed-official upload starts as community_reported;
          // only verification against an official source upgrades it.
          verificationStatus: "community_reported",
          contributorId: input.userId,
        })
        .returning({ id: documents.id });

      const [version] = await tx
        .insert(documentVersions)
        .values({
          documentId: doc.id,
          versionNumber: 1,
          storageKey,
          originalFilename: input.originalFilename.slice(0, 200),
          mimeType: input.upload.mimeType,
          format: input.upload.format,
          fileSize: input.upload.size,
          sha256: input.upload.sha256,
          uploadedById: input.userId,
          scanStatus: "unscanned",
        })
        .returning({ id: documentVersions.id });

      await tx
        .update(documents)
        .set({ currentVersionId: version.id })
        .where(eq(documents.id, doc.id));

      const [contribution] = await tx
        .insert(contributions)
        .values({
          userId: input.userId,
          type: "submit_document",
          entityType: "document",
          entityId: doc.id,
          payload: {
            slug,
            title: input.title,
            layer: input.layer,
            sourceUrl: input.sourceUrl ?? null,
          },
          status: "pending",
        })
        .returning({ id: contributions.id });

      await audit({
        userId: input.userId,
        action: "contribution.submit_document",
        entityType: "document",
        entityId: doc.id,
      });
      return { contributionId: contribution.id };
    });
  } catch (error) {
    await storage.delete(storageKey);
    throw error;
  }
}

/** Report a problem with content. Every flag enters the moderation workflow. */
export async function submitFlag(input: {
  entityType: EntityType;
  entityId: string;
  reason: FlagReason;
  details?: string;
  reporterId: string | null;
}): Promise<void> {
  const [flag] = await db
    .insert(flags)
    .values({
      entityType: input.entityType,
      entityId: input.entityId,
      reason: input.reason,
      details: input.details ?? null,
      reporterId: input.reporterId,
      status: "open",
    })
    .returning({ id: flags.id });
  await audit({
    userId: input.reporterId,
    action: "flag.submit",
    entityType: input.entityType,
    entityId: input.entityId,
    metadata: { flagId: flag.id, reason: input.reason },
  });
}

export async function listUserContributions(userId: string) {
  return db.query.contributions.findMany({
    where: eq(contributions.userId, userId),
    orderBy: [desc(contributions.createdAt)],
    limit: 100,
  });
}

/** Guard against duplicate pending edits by the same user on the same entity. */
export async function assertNoPendingContribution(
  userId: string,
  entityType: EntityType,
  entityId: string,
): Promise<void> {
  const existing = await db.query.contributions.findFirst({
    where: and(
      eq(contributions.userId, userId),
      eq(contributions.entityType, entityType),
      eq(contributions.entityId, entityId),
      eq(contributions.status, "pending"),
    ),
  });
  if (existing) {
    throw new ConflictError(
      "You already have a pending contribution for this content. Wait for review before submitting another.",
    );
  }
}
