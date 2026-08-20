import "server-only";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import {
  communityNotes,
  contributions,
  documents,
  flags,
  knowledgePages,
  pageSections,
  revisions,
  users,
} from "@/lib/db/schema";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { indexDocument, indexKnowledgePage } from "@/lib/search/indexer";
import type { PageSnapshot } from "./pages";
import { adjustReputation } from "./users";
import { REPUTATION_REWARDS } from "./verification-logic";

export async function listPendingContributions() {
  return db
    .select({ contribution: contributions, authorName: users.name, authorRole: users.role })
    .from(contributions)
    .innerJoin(users, eq(contributions.userId, users.id))
    .where(eq(contributions.status, "pending"))
    .orderBy(asc(contributions.createdAt))
    .limit(100);
}

export async function listOpenFlags() {
  return db
    .select({ flag: flags, reporterName: users.name })
    .from(flags)
    .leftJoin(users, eq(flags.reporterId, users.id))
    .where(eq(flags.status, "open"))
    .orderBy(asc(flags.createdAt))
    .limit(100);
}

export async function getContribution(contributionId: string) {
  return db.query.contributions.findFirst({ where: eq(contributions.id, contributionId) });
}

/**
 * Apply an approved page revision snapshot to the live page. Sections are
 * replaced atomically; the revision number advances; the search index is
 * refreshed. Used both for approvals and for moderator reverts.
 */
async function applyPageSnapshot(
  pageId: string,
  snapshot: PageSnapshot,
  revisionNumber: number,
  publish: boolean,
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .update(knowledgePages)
      .set({
        title: snapshot.title,
        summary: snapshot.summary,
        currentRevisionNumber: revisionNumber,
        ...(publish ? { status: "published" as const } : {}),
        updatedAt: new Date(),
      })
      .where(eq(knowledgePages.id, pageId));

    await tx.delete(pageSections).where(eq(pageSections.pageId, pageId));
    if (snapshot.sections.length > 0) {
      await tx.insert(pageSections).values(
        snapshot.sections.map((section, index) => ({
          pageId,
          sortOrder: index,
          heading: section.heading,
          body: section.body,
          layer: section.layer,
        })),
      );
    }
  });
  await indexKnowledgePage(pageId);
}

/**
 * Approve a pending contribution. Revision-backed contributions apply their
 * snapshot; document submissions become published (and downloadable);
 * experience notes become publicly visible. The contributor earns
 * reputation.
 */
export async function approveContribution(input: {
  contributionId: string;
  reviewerId: string;
  reviewNote?: string;
}): Promise<void> {
  const contribution = await getContribution(input.contributionId);
  if (!contribution) throw new NotFoundError("Contribution not found.");
  if (contribution.status !== "pending") {
    throw new ConflictError("This contribution has already been decided.");
  }

  // Apply the effect of the contribution.
  if (contribution.revisionId) {
    const revision = await db.query.revisions.findFirst({
      where: eq(revisions.id, contribution.revisionId),
    });
    if (!revision) throw new NotFoundError("Linked revision not found.");
    if (revision.status !== "pending") {
      throw new ConflictError("The linked revision has already been decided.");
    }
    const snapshot = revision.snapshot as unknown as PageSnapshot;
    const publish = contribution.type === "create_page";
    await applyPageSnapshot(revision.entityId, snapshot, revision.revisionNumber, publish);
    await db
      .update(revisions)
      .set({
        status: "approved",
        reviewedById: input.reviewerId,
        reviewedAt: new Date(),
        reviewNote: input.reviewNote ?? null,
      })
      .where(eq(revisions.id, revision.id));
  } else if (contribution.type === "submit_document" && contribution.entityId) {
    await db
      .update(documents)
      .set({ status: "published", updatedAt: new Date() })
      .where(eq(documents.id, contribution.entityId));
    await indexDocument(contribution.entityId);
  } else if (contribution.noteId) {
    await db
      .update(communityNotes)
      .set({ status: "published", moderatedById: input.reviewerId, moderatedAt: new Date() })
      .where(eq(communityNotes.id, contribution.noteId));
  }

  await db
    .update(contributions)
    .set({
      status: "approved",
      reviewerId: input.reviewerId,
      reviewNote: input.reviewNote ?? null,
      decidedAt: new Date(),
    })
    .where(eq(contributions.id, contribution.id));

  await adjustReputation(
    contribution.userId,
    contribution.noteId
      ? REPUTATION_REWARDS.approvedNote
      : REPUTATION_REWARDS.approvedContribution,
  );
  await audit({
    userId: input.reviewerId,
    action: "moderation.approve_contribution",
    entityType: contribution.entityType ?? undefined,
    entityId: contribution.entityId ?? undefined,
    metadata: { contributionId: contribution.id, type: contribution.type },
  });
}

export async function rejectContribution(input: {
  contributionId: string;
  reviewerId: string;
  reviewNote: string;
  needsClarification?: boolean;
}): Promise<void> {
  const contribution = await getContribution(input.contributionId);
  if (!contribution) throw new NotFoundError("Contribution not found.");
  if (contribution.status !== "pending") {
    throw new ConflictError("This contribution has already been decided.");
  }

  if (contribution.revisionId) {
    await db
      .update(revisions)
      .set({
        status: "rejected",
        reviewedById: input.reviewerId,
        reviewedAt: new Date(),
        reviewNote: input.reviewNote,
      })
      .where(eq(revisions.id, contribution.revisionId));
  }
  if (contribution.noteId) {
    await db
      .update(communityNotes)
      .set({ status: "rejected", moderatedById: input.reviewerId, moderatedAt: new Date() })
      .where(eq(communityNotes.id, contribution.noteId));
  }
  if (contribution.type === "submit_document" && contribution.entityId) {
    await db
      .update(documents)
      .set({ status: "archived", updatedAt: new Date() })
      .where(eq(documents.id, contribution.entityId));
  }
  if (contribution.type === "create_page" && contribution.entityId) {
    await db
      .update(knowledgePages)
      .set({ status: "archived", updatedAt: new Date() })
      .where(eq(knowledgePages.id, contribution.entityId));
  }

  await db
    .update(contributions)
    .set({
      status: input.needsClarification ? "needs_clarification" : "rejected",
      reviewerId: input.reviewerId,
      reviewNote: input.reviewNote,
      decidedAt: new Date(),
    })
    .where(eq(contributions.id, contribution.id));

  await audit({
    userId: input.reviewerId,
    action: "moderation.reject_contribution",
    entityType: contribution.entityType ?? undefined,
    entityId: contribution.entityId ?? undefined,
    metadata: { contributionId: contribution.id },
  });
}

export async function resolveFlag(input: {
  flagId: string;
  resolverId: string;
  resolution: "resolved" | "dismissed";
  resolutionNote?: string;
}): Promise<void> {
  const flag = await db.query.flags.findFirst({ where: eq(flags.id, input.flagId) });
  if (!flag) throw new NotFoundError("Report not found.");
  if (flag.status !== "open" && flag.status !== "in_review") {
    throw new ConflictError("This report has already been handled.");
  }
  await db
    .update(flags)
    .set({
      status: input.resolution,
      resolverId: input.resolverId,
      resolutionNote: input.resolutionNote ?? null,
      resolvedAt: new Date(),
    })
    .where(eq(flags.id, input.flagId));

  if (input.resolution === "resolved" && flag.reporterId) {
    await adjustReputation(flag.reporterId, REPUTATION_REWARDS.resolvedAccurateFlag);
  }
  await audit({
    userId: input.resolverId,
    action: "moderation.resolve_flag",
    entityType: flag.entityType,
    entityId: flag.entityId,
    metadata: { flagId: flag.id, resolution: input.resolution },
  });
}

/**
 * Revert a page to a previous approved revision. Implemented as a new,
 * immediately-approved revision whose snapshot is the old content — history
 * is append-only and never rewritten.
 */
export async function revertToRevision(input: {
  revisionId: string;
  moderatorId: string;
  reason: string;
}): Promise<void> {
  const target = await db.query.revisions.findFirst({ where: eq(revisions.id, input.revisionId) });
  if (!target || target.entityType !== "knowledge_page") {
    throw new NotFoundError("Revision not found.");
  }
  if (target.status !== "approved") {
    throw new ConflictError("Only approved revisions can be reverted to.");
  }

  const [{ maxNumber }] = await db
    .select({ maxNumber: sql<number>`COALESCE(MAX(${revisions.revisionNumber}), 0)` })
    .from(revisions)
    .where(and(eq(revisions.entityType, "knowledge_page"), eq(revisions.entityId, target.entityId)));

  const page = await db.query.knowledgePages.findFirst({
    where: eq(knowledgePages.id, target.entityId),
  });
  if (!page) throw new NotFoundError("Page not found.");

  const currentSections = await db
    .select()
    .from(pageSections)
    .where(eq(pageSections.pageId, page.id))
    .orderBy(asc(pageSections.sortOrder));

  const newNumber = Number(maxNumber) + 1;
  const snapshot = target.snapshot as unknown as PageSnapshot;

  await db.insert(revisions).values({
    entityType: "knowledge_page",
    entityId: target.entityId,
    revisionNumber: newNumber,
    snapshot: target.snapshot,
    previousSnapshot: {
      title: page.title,
      summary: page.summary,
      sections: currentSections.map((s) => ({ heading: s.heading, body: s.body, layer: s.layer })),
    },
    authorId: input.moderatorId,
    changeReason: `Revert to revision #${target.revisionNumber}: ${input.reason}`,
    status: "approved",
    reviewedById: input.moderatorId,
    reviewedAt: new Date(),
  });

  await applyPageSnapshot(target.entityId, snapshot, newNumber, false);
  await audit({
    userId: input.moderatorId,
    action: "moderation.revert_revision",
    entityType: "knowledge_page",
    entityId: target.entityId,
    metadata: { revertedTo: target.revisionNumber },
  });
}

export async function listRecentDecisions(limit = 20) {
  return db
    .select({ contribution: contributions, authorName: users.name })
    .from(contributions)
    .innerJoin(users, eq(contributions.userId, users.id))
    .where(sql`${contributions.status} != 'pending'`)
    .orderBy(desc(contributions.decidedAt))
    .limit(limit);
}
