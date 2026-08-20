import "server-only";
import { and, asc, desc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  categories,
  knowledgePages,
  locations,
  pageSections,
  revisions,
  users,
} from "@/lib/db/schema";

export type KnowledgePageRow = typeof knowledgePages.$inferSelect;
export type PageSectionRow = typeof pageSections.$inferSelect;
export type RevisionRow = typeof revisions.$inferSelect;

/** Snapshot shape stored in the revision store for knowledge pages. */
export interface PageSnapshot {
  title: Record<string, string>;
  summary: Record<string, string>;
  sections: Array<{
    heading: Record<string, string>;
    body: Record<string, string>;
    layer: "official" | "community";
  }>;
  [key: string]: unknown;
}

export function pageToSnapshot(
  page: Pick<KnowledgePageRow, "title" | "summary">,
  sections: Array<Pick<PageSectionRow, "heading" | "body" | "layer">>,
): PageSnapshot {
  return {
    title: { ...page.title } as Record<string, string>,
    summary: { ...page.summary } as Record<string, string>,
    sections: sections.map((s) => ({
      heading: { ...s.heading } as Record<string, string>,
      body: { ...s.body } as Record<string, string>,
      layer: s.layer,
    })),
  };
}

export async function listPublishedPages(options?: {
  categoryId?: string;
  limit?: number;
  offset?: number;
}) {
  return db
    .select({
      page: knowledgePages,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(knowledgePages)
    .leftJoin(categories, eq(knowledgePages.categoryId, categories.id))
    .where(
      and(
        eq(knowledgePages.status, "published"),
        options?.categoryId ? eq(knowledgePages.categoryId, options.categoryId) : undefined,
      ),
    )
    .orderBy(desc(knowledgePages.updatedAt))
    .limit(Math.min(options?.limit ?? 50, 100))
    .offset(options?.offset ?? 0);
}

export async function getPageBySlug(slug: string) {
  const page = await db.query.knowledgePages.findFirst({
    where: and(eq(knowledgePages.slug, slug), eq(knowledgePages.status, "published")),
  });
  if (!page) return null;

  const [sections, category, location] = await Promise.all([
    db
      .select()
      .from(pageSections)
      .where(eq(pageSections.pageId, page.id))
      .orderBy(asc(pageSections.sortOrder)),
    page.categoryId
      ? db.query.categories.findFirst({ where: eq(categories.id, page.categoryId) })
      : Promise.resolve(undefined),
    page.locationId
      ? db.query.locations.findFirst({ where: eq(locations.id, page.locationId) })
      : Promise.resolve(undefined),
  ]);

  return { page, sections, category: category ?? null, location: location ?? null };
}

/** Page + sections regardless of status, for editing/preview by the author flow. */
export async function getPageForEdit(slug: string) {
  const page = await db.query.knowledgePages.findFirst({ where: eq(knowledgePages.slug, slug) });
  if (!page) return null;
  const sections = await db
    .select()
    .from(pageSections)
    .where(eq(pageSections.pageId, page.id))
    .orderBy(asc(pageSections.sortOrder));
  return { page, sections };
}

export async function listRecentlyUpdatedPages(limit = 6) {
  return db.query.knowledgePages.findMany({
    where: eq(knowledgePages.status, "published"),
    orderBy: [desc(knowledgePages.updatedAt)],
    limit,
  });
}

export async function listRecentlyVerifiedPages(limit = 6) {
  return db.query.knowledgePages.findMany({
    where: and(eq(knowledgePages.status, "published"), isNotNull(knowledgePages.lastVerifiedAt)),
    orderBy: [desc(knowledgePages.lastVerifiedAt)],
    limit,
  });
}

/** Approved revision history for a page, newest first, with author names. */
export async function listPageRevisions(pageId: string) {
  return db
    .select({
      revision: revisions,
      authorName: users.name,
    })
    .from(revisions)
    .leftJoin(users, eq(revisions.authorId, users.id))
    .where(and(eq(revisions.entityType, "knowledge_page"), eq(revisions.entityId, pageId)))
    .orderBy(desc(revisions.revisionNumber));
}

export async function getRevision(revisionId: string) {
  return db.query.revisions.findFirst({ where: eq(revisions.id, revisionId) });
}

/** Distinct contributors who authored approved revisions of a page. */
export async function listPageContributors(pageId: string) {
  const rows = await db
    .selectDistinct({ id: users.id, name: users.name, role: users.role })
    .from(revisions)
    .innerJoin(users, eq(revisions.authorId, users.id))
    .where(
      and(
        eq(revisions.entityType, "knowledge_page"),
        eq(revisions.entityId, pageId),
        eq(revisions.status, "approved"),
      ),
    );
  return rows;
}
