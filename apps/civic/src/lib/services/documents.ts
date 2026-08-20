import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  categories,
  documentVersions,
  documents,
  governmentOrganizations,
  sources,
  users,
} from "@/lib/db/schema";
import type { SessionUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";

export type DocumentRow = typeof documents.$inferSelect;
export type DocumentVersionRow = typeof documentVersions.$inferSelect;

export async function listPublishedDocuments(options?: {
  categoryId?: string;
  layer?: "official" | "community";
  limit?: number;
  offset?: number;
}) {
  return db
    .select({
      document: documents,
      categoryName: categories.name,
      categorySlug: categories.slug,
      organizationName: governmentOrganizations.name,
    })
    .from(documents)
    .leftJoin(categories, eq(documents.categoryId, categories.id))
    .leftJoin(
      governmentOrganizations,
      eq(documents.issuingOrganizationId, governmentOrganizations.id),
    )
    .where(
      and(
        eq(documents.status, "published"),
        options?.categoryId ? eq(documents.categoryId, options.categoryId) : undefined,
        options?.layer ? eq(documents.layer, options.layer) : undefined,
      ),
    )
    .orderBy(desc(documents.updatedAt))
    .limit(Math.min(options?.limit ?? 50, 100))
    .offset(options?.offset ?? 0);
}

export interface DocumentDetail {
  document: DocumentRow;
  category: typeof categories.$inferSelect | null;
  organization: typeof governmentOrganizations.$inferSelect | null;
  source: typeof sources.$inferSelect | null;
  contributorName: string | null;
  versions: DocumentVersionRow[];
  currentVersion: DocumentVersionRow | null;
}

export async function getDocumentBySlug(slug: string): Promise<DocumentDetail | null> {
  const document = await db.query.documents.findFirst({
    where: and(eq(documents.slug, slug), eq(documents.status, "published")),
  });
  if (!document) return null;

  const [versions, category, organization, source, contributor] = await Promise.all([
    db
      .select()
      .from(documentVersions)
      .where(eq(documentVersions.documentId, document.id))
      .orderBy(desc(documentVersions.versionNumber)),
    document.categoryId
      ? db.query.categories.findFirst({ where: eq(categories.id, document.categoryId) })
      : Promise.resolve(undefined),
    document.issuingOrganizationId
      ? db.query.governmentOrganizations.findFirst({
          where: eq(governmentOrganizations.id, document.issuingOrganizationId),
        })
      : Promise.resolve(undefined),
    document.sourceId
      ? db.query.sources.findFirst({ where: eq(sources.id, document.sourceId) })
      : Promise.resolve(undefined),
    document.contributorId
      ? db.query.users.findFirst({ where: eq(users.id, document.contributorId) })
      : Promise.resolve(undefined),
  ]);

  const currentVersion =
    versions.find((v) => v.id === document.currentVersionId) ?? versions[0] ?? null;

  return {
    document,
    category: category ?? null,
    organization: organization ?? null,
    source: source ?? null,
    contributorName: contributor?.name ?? null,
    versions,
    currentVersion,
  };
}

/**
 * Central access decision for downloading a document file.
 * Files are never served directly; the download route calls this first.
 */
export function canDownloadDocument(
  document: Pick<DocumentRow, "access" | "status" | "contributorId">,
  user: SessionUser | null,
): boolean {
  // Unpublished files are visible only to moderators and their contributor.
  if (document.status !== "published") {
    if (!user) return false;
    if (user.id === document.contributorId) return true;
    return hasPermission(user.role, "moderation:review_contributions");
  }
  switch (document.access) {
    case "public":
    case "moderated_public":
      return true;
    case "private_contributor":
      return user !== null && (user.id === document.contributorId ||
        hasPermission(user.role, "moderation:review_contributions"));
    case "restricted_admin":
      return user !== null && hasPermission(user.role, "admin:access_dashboard");
  }
}

export async function getDocumentWithVersionById(documentId: string) {
  const document = await db.query.documents.findFirst({ where: eq(documents.id, documentId) });
  if (!document) return null;
  const versions = await db
    .select()
    .from(documentVersions)
    .where(eq(documentVersions.documentId, documentId))
    .orderBy(desc(documentVersions.versionNumber));
  const currentVersion =
    versions.find((v) => v.id === document.currentVersionId) ?? versions[0] ?? null;
  return { document, currentVersion };
}

export async function listRecentDocuments(limit = 6) {
  return db.query.documents.findMany({
    where: eq(documents.status, "published"),
    orderBy: [desc(documents.updatedAt)],
    limit,
  });
}
