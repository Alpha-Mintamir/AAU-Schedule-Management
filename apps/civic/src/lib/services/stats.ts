import "server-only";
import { and, count, countDistinct, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  communityNotes,
  contributions,
  documents,
  flags,
  governmentOffices,
  knowledgePages,
  processes,
  users,
} from "@/lib/db/schema";

export interface AdminStats {
  totalPages: number;
  totalProcesses: number;
  totalOffices: number;
  totalDocuments: number;
  pendingContributions: number;
  pendingDocuments: number;
  openFlags: number;
  unverifiedPages: number;
  outdatedItems: number;
  activeContributors30d: number;
  totalUsers: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    [pages],
    [procs],
    [offices],
    [docs],
    [pendingContribs],
    [pendingDocs],
    [openFlagRows],
    [unverified],
    outdatedCounts,
    [activeContribs],
    [userCount],
  ] = await Promise.all([
    db.select({ value: count() }).from(knowledgePages).where(eq(knowledgePages.status, "published")),
    db.select({ value: count() }).from(processes).where(eq(processes.status, "published")),
    db
      .select({ value: count() })
      .from(governmentOffices)
      .where(eq(governmentOffices.status, "published")),
    db.select({ value: count() }).from(documents).where(eq(documents.status, "published")),
    db.select({ value: count() }).from(contributions).where(eq(contributions.status, "pending")),
    db
      .select({ value: count() })
      .from(contributions)
      .where(and(eq(contributions.status, "pending"), eq(contributions.type, "submit_document"))),
    db.select({ value: count() }).from(flags).where(eq(flags.status, "open")),
    db
      .select({ value: count() })
      .from(knowledgePages)
      .where(
        and(
          eq(knowledgePages.status, "published"),
          inArray(knowledgePages.verificationStatus, ["unknown", "community_reported"]),
        ),
      ),
    Promise.all([
      db
        .select({ value: count() })
        .from(knowledgePages)
        .where(eq(knowledgePages.verificationStatus, "outdated")),
      db
        .select({ value: count() })
        .from(processes)
        .where(eq(processes.verificationStatus, "outdated")),
      db
        .select({ value: count() })
        .from(governmentOffices)
        .where(eq(governmentOffices.verificationStatus, "outdated")),
      db
        .select({ value: count() })
        .from(documents)
        .where(eq(documents.verificationStatus, "outdated")),
    ]),
    db
      .select({ value: countDistinct(contributions.userId) })
      .from(contributions)
      .where(gte(contributions.createdAt, thirtyDaysAgo)),
    db.select({ value: count() }).from(users),
  ]);

  return {
    totalPages: pages.value,
    totalProcesses: procs.value,
    totalOffices: offices.value,
    totalDocuments: docs.value,
    pendingContributions: pendingContribs.value,
    pendingDocuments: pendingDocs.value,
    openFlags: openFlagRows.value,
    unverifiedPages: unverified.value,
    outdatedItems: outdatedCounts.reduce((sum, [row]) => sum + row.value, 0),
    activeContributors30d: activeContribs.value,
    totalUsers: userCount.value,
  };
}

/** Most-reported entities, for the admin dashboard. */
export async function listMostReported(limit = 8) {
  return db
    .select({
      entityType: flags.entityType,
      entityId: flags.entityId,
      reportCount: count(),
    })
    .from(flags)
    .where(sql`${flags.status} IN ('open', 'in_review')`)
    .groupBy(flags.entityType, flags.entityId)
    .orderBy(desc(count()))
    .limit(limit);
}

export async function listRecentUsers(limit = 50) {
  return db.query.users.findMany({
    orderBy: [desc(users.createdAt)],
    limit,
    columns: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      reputation: true,
      createdAt: true,
    },
  });
}

/** Homepage community activity: latest published notes with their target. */
export async function listRecentCommunityActivity(limit = 5) {
  return db
    .select({
      note: communityNotes,
      authorName: users.name,
    })
    .from(communityNotes)
    .innerJoin(users, eq(communityNotes.authorId, users.id))
    .where(eq(communityNotes.status, "published"))
    .orderBy(desc(communityNotes.createdAt))
    .limit(limit);
}
