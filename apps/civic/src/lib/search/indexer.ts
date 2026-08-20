import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  documents,
  entityTags,
  governmentOffices,
  knowledgePages,
  locations,
  pageSections,
  processes,
  processSteps,
  searchAliases,
  searchDocuments,
  tags,
  type entityTypeEnum,
} from "@/lib/db/schema";
import { SUPPORTED_LOCALES, lt, type Locale, type LocalizedText } from "@/lib/i18n";
import { markdownToPlainText } from "@/lib/markdown";

type EntityType = (typeof entityTypeEnum.enumValues)[number];

interface IndexInput {
  entityType: EntityType;
  entityId: string;
  slug: string;
  url: string;
  title: LocalizedText;
  summary?: LocalizedText | null;
  bodyParts?: LocalizedText[];
  extraKeywords?: string[];
  verificationStatus: string;
  facets?: Record<string, string>;
}

async function collectKeywords(entityType: EntityType, entityId: string): Promise<string[]> {
  const [aliasRows, tagRows] = await Promise.all([
    db
      .select({ alias: searchAliases.alias })
      .from(searchAliases)
      .where(and(eq(searchAliases.entityType, entityType), eq(searchAliases.entityId, entityId))),
    db
      .select({ name: tags.name })
      .from(entityTags)
      .innerJoin(tags, eq(entityTags.tagId, tags.id))
      .where(and(eq(entityTags.entityType, entityType), eq(entityTags.entityId, entityId))),
  ]);
  const keywords = aliasRows.map((r) => r.alias);
  for (const tag of tagRows) {
    for (const value of Object.values(tag.name)) {
      if (value) keywords.push(value);
    }
  }
  return keywords;
}

/**
 * Upsert one search document per locale that has a title translation.
 * All titles across locales are folded into keywords so a search in one
 * language can find content titled in another.
 */
async function upsertSearchDocs(input: IndexInput): Promise<void> {
  const keywords = [...(input.extraKeywords ?? []), ...(await collectKeywords(input.entityType, input.entityId))];
  const allTitles = Object.values(input.title).filter(Boolean) as string[];

  const localesToIndex = SUPPORTED_LOCALES.filter(
    (locale) => (input.title[locale] ?? "").trim().length > 0 || locale === "en",
  );

  for (const locale of localesToIndex) {
    const title = lt(input.title, locale);
    if (!title) continue;
    const summary = input.summary ? lt(input.summary, locale) : null;
    const body = (input.bodyParts ?? [])
      .map((part) => markdownToPlainText(lt(part, locale)))
      .filter(Boolean)
      .join("\n")
      .slice(0, 20000);
    const keywordText = [...new Set([...keywords, ...allTitles])].join(" ").slice(0, 2000);

    await db
      .insert(searchDocuments)
      .values({
        entityType: input.entityType,
        entityId: input.entityId,
        locale,
        slug: input.slug,
        url: input.url,
        title,
        summary: summary || null,
        body: body || null,
        keywords: keywordText || null,
        verificationStatus:
          input.verificationStatus as (typeof searchDocuments.$inferInsert)["verificationStatus"],
        facets: input.facets ?? null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [searchDocuments.entityType, searchDocuments.entityId, searchDocuments.locale],
        set: {
          slug: input.slug,
          url: input.url,
          title,
          summary: summary || null,
          body: body || null,
          keywords: keywordText || null,
          verificationStatus:
            input.verificationStatus as (typeof searchDocuments.$inferInsert)["verificationStatus"],
          facets: input.facets ?? null,
          updatedAt: new Date(),
        },
      });
  }
}

export async function removeFromIndex(entityType: EntityType, entityId: string): Promise<void> {
  await db
    .delete(searchDocuments)
    .where(and(eq(searchDocuments.entityType, entityType), eq(searchDocuments.entityId, entityId)));
}

export async function indexKnowledgePage(pageId: string): Promise<void> {
  const page = await db.query.knowledgePages.findFirst({ where: eq(knowledgePages.id, pageId) });
  if (!page || page.status !== "published") {
    await removeFromIndex("knowledge_page", pageId);
    return;
  }
  const sections = await db
    .select()
    .from(pageSections)
    .where(eq(pageSections.pageId, pageId));
  await upsertSearchDocs({
    entityType: "knowledge_page",
    entityId: page.id,
    slug: page.slug,
    url: `/pages/${page.slug}`,
    title: page.title,
    summary: page.summary,
    bodyParts: sections.flatMap((s) => [s.heading, s.body]),
    verificationStatus: page.verificationStatus,
  });
}

export async function indexProcess(processId: string): Promise<void> {
  const process = await db.query.processes.findFirst({ where: eq(processes.id, processId) });
  if (!process || process.status !== "published") {
    await removeFromIndex("process", processId);
    return;
  }
  const steps = await db
    .select()
    .from(processSteps)
    .where(eq(processSteps.processId, processId));
  await upsertSearchDocs({
    entityType: "process",
    entityId: process.id,
    slug: process.slug,
    url: `/processes/${process.slug}`,
    title: process.title,
    summary: process.summary,
    bodyParts: [
      process.officialProcedure ?? {},
      process.practicalGuide ?? {},
      ...steps.flatMap((s) => [s.title, s.officialBody ?? {}, s.communityBody ?? {}]),
    ],
    verificationStatus: process.verificationStatus,
  });
}

export async function indexOffice(officeId: string): Promise<void> {
  const office = await db.query.governmentOffices.findFirst({
    where: eq(governmentOffices.id, officeId),
  });
  if (!office || office.status !== "published") {
    await removeFromIndex("office", officeId);
    return;
  }
  const location = office.locationId
    ? await db.query.locations.findFirst({ where: eq(locations.id, office.locationId) })
    : null;
  await upsertSearchDocs({
    entityType: "office",
    entityId: office.id,
    slug: office.slug,
    url: `/offices/${office.slug}`,
    title: office.name,
    summary: office.address ?? null,
    extraKeywords: location ? (Object.values(location.name).filter(Boolean) as string[]) : [],
    verificationStatus: office.verificationStatus,
    facets: location ? { location: location.slug } : undefined,
  });
}

export async function indexDocument(documentId: string): Promise<void> {
  const doc = await db.query.documents.findFirst({ where: eq(documents.id, documentId) });
  if (!doc || doc.status !== "published") {
    await removeFromIndex("document", documentId);
    return;
  }
  await upsertSearchDocs({
    entityType: "document",
    entityId: doc.id,
    slug: doc.slug,
    url: `/documents/${doc.slug}`,
    title: doc.title,
    summary: doc.description ?? null,
    extraKeywords: [doc.docType, doc.layer === "official" ? "official form" : "community template"],
    verificationStatus: doc.verificationStatus,
  });
}

export async function indexLocation(locationId: string): Promise<void> {
  const location = await db.query.locations.findFirst({ where: eq(locations.id, locationId) });
  if (!location) {
    await removeFromIndex("location", locationId);
    return;
  }
  await upsertSearchDocs({
    entityType: "location",
    entityId: location.id,
    slug: location.slug,
    url: `/locations/${location.slug}`,
    title: location.name,
    summary: location.description ?? null,
    extraKeywords: [location.type],
    verificationStatus: "unknown",
  });
}

/** Reindex a batch of entities; used by seed and admin maintenance. */
export async function reindexAll(): Promise<void> {
  const [pageRows, processRows, officeRows, documentRows, locationRows] = await Promise.all([
    db.select({ id: knowledgePages.id }).from(knowledgePages),
    db.select({ id: processes.id }).from(processes),
    db.select({ id: governmentOffices.id }).from(governmentOffices),
    db.select({ id: documents.id }).from(documents),
    db.select({ id: locations.id }).from(locations),
  ]);
  for (const row of pageRows) await indexKnowledgePage(row.id);
  for (const row of processRows) await indexProcess(row.id);
  for (const row of officeRows) await indexOffice(row.id);
  for (const row of documentRows) await indexDocument(row.id);
  for (const row of locationRows) await indexLocation(row.id);
}

export async function removeManyFromIndex(entityType: EntityType, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await db
    .delete(searchDocuments)
    .where(and(eq(searchDocuments.entityType, entityType), inArray(searchDocuments.entityId, ids)));
}
