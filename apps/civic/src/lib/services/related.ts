import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  documents,
  entityLinks,
  governmentOffices,
  knowledgePages,
  processes,
  type entityTypeEnum,
} from "@/lib/db/schema";
import type { LocalizedText } from "@/lib/i18n";

type EntityType = (typeof entityTypeEnum.enumValues)[number];

export interface RelatedItem {
  entityType: EntityType;
  entityId: string;
  slug: string;
  url: string;
  title: LocalizedText;
}

const URL_PREFIX: Partial<Record<EntityType, string>> = {
  knowledge_page: "/pages",
  process: "/processes",
  office: "/offices",
  document: "/documents",
  location: "/locations",
};

/**
 * Resolve entity links (in both directions) into displayable related items,
 * only surfacing published targets.
 */
export async function listRelated(entityType: EntityType, entityId: string): Promise<RelatedItem[]> {
  const [outgoing, incoming] = await Promise.all([
    db
      .select({ type: entityLinks.toType, id: entityLinks.toId })
      .from(entityLinks)
      .where(and(eq(entityLinks.fromType, entityType), eq(entityLinks.fromId, entityId))),
    db
      .select({ type: entityLinks.fromType, id: entityLinks.fromId })
      .from(entityLinks)
      .where(and(eq(entityLinks.toType, entityType), eq(entityLinks.toId, entityId))),
  ]);

  const byType = new Map<EntityType, Set<string>>();
  for (const row of [...outgoing, ...incoming]) {
    const set = byType.get(row.type) ?? new Set<string>();
    set.add(row.id);
    byType.set(row.type, set);
  }

  const items: RelatedItem[] = [];

  const pageIds = [...(byType.get("knowledge_page") ?? [])];
  if (pageIds.length > 0) {
    const rows = await db
      .select({ id: knowledgePages.id, slug: knowledgePages.slug, title: knowledgePages.title })
      .from(knowledgePages)
      .where(and(inArray(knowledgePages.id, pageIds), eq(knowledgePages.status, "published")));
    items.push(
      ...rows.map((r) => ({
        entityType: "knowledge_page" as const,
        entityId: r.id,
        slug: r.slug,
        url: `${URL_PREFIX.knowledge_page}/${r.slug}`,
        title: r.title,
      })),
    );
  }

  const processIds = [...(byType.get("process") ?? [])];
  if (processIds.length > 0) {
    const rows = await db
      .select({ id: processes.id, slug: processes.slug, title: processes.title })
      .from(processes)
      .where(and(inArray(processes.id, processIds), eq(processes.status, "published")));
    items.push(
      ...rows.map((r) => ({
        entityType: "process" as const,
        entityId: r.id,
        slug: r.slug,
        url: `${URL_PREFIX.process}/${r.slug}`,
        title: r.title,
      })),
    );
  }

  const officeIds = [...(byType.get("office") ?? [])];
  if (officeIds.length > 0) {
    const rows = await db
      .select({ id: governmentOffices.id, slug: governmentOffices.slug, name: governmentOffices.name })
      .from(governmentOffices)
      .where(and(inArray(governmentOffices.id, officeIds), eq(governmentOffices.status, "published")));
    items.push(
      ...rows.map((r) => ({
        entityType: "office" as const,
        entityId: r.id,
        slug: r.slug,
        url: `${URL_PREFIX.office}/${r.slug}`,
        title: r.name,
      })),
    );
  }

  const documentIds = [...(byType.get("document") ?? [])];
  if (documentIds.length > 0) {
    const rows = await db
      .select({ id: documents.id, slug: documents.slug, title: documents.title })
      .from(documents)
      .where(and(inArray(documents.id, documentIds), eq(documents.status, "published")));
    items.push(
      ...rows.map((r) => ({
        entityType: "document" as const,
        entityId: r.id,
        slug: r.slug,
        url: `${URL_PREFIX.document}/${r.slug}`,
        title: r.title,
      })),
    );
  }

  return items;
}
