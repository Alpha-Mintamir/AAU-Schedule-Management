import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { citations, sources, type entityTypeEnum } from "@/lib/db/schema";

type EntityType = (typeof entityTypeEnum.enumValues)[number];

export type SourceRow = typeof sources.$inferSelect;
export type CitationWithSource = typeof citations.$inferSelect & { source: SourceRow };

/** Sources cited by a specific entity, for the "Sources" section of pages. */
export async function listCitationsForEntity(
  entityType: EntityType,
  entityId: string,
): Promise<CitationWithSource[]> {
  const rows = await db
    .select()
    .from(citations)
    .innerJoin(sources, eq(citations.sourceId, sources.id))
    .where(and(eq(citations.entityType, entityType), eq(citations.entityId, entityId)));
  return rows.map((row) => ({ ...row.citations, source: row.sources }));
}

export async function listCitationsForEntities(
  entityType: EntityType,
  entityIds: string[],
): Promise<Map<string, CitationWithSource[]>> {
  const result = new Map<string, CitationWithSource[]>();
  if (entityIds.length === 0) return result;
  const rows = await db
    .select()
    .from(citations)
    .innerJoin(sources, eq(citations.sourceId, sources.id))
    .where(and(eq(citations.entityType, entityType), inArray(citations.entityId, entityIds)));
  for (const row of rows) {
    const list = result.get(row.citations.entityId) ?? [];
    list.push({ ...row.citations, source: row.sources });
    result.set(row.citations.entityId, list);
  }
  return result;
}

export async function getSourcesByIds(ids: string[]): Promise<Map<string, SourceRow>> {
  const map = new Map<string, SourceRow>();
  const clean = ids.filter(Boolean);
  if (clean.length === 0) return map;
  const rows = await db.select().from(sources).where(inArray(sources.id, clean));
  for (const row of rows) map.set(row.id, row);
  return map;
}

export async function listSources(): Promise<SourceRow[]> {
  return db.query.sources.findMany({ orderBy: (s, { desc }) => [desc(s.createdAt)] });
}

export async function createSource(input: {
  url?: string;
  title: string;
  organization?: string;
  type: SourceRow["type"];
  reliability?: SourceRow["reliability"];
  publishedAt?: Date;
  retrievedAt?: Date;
  version?: string;
  notes?: string;
  addedById: string;
}): Promise<SourceRow> {
  const [row] = await db
    .insert(sources)
    .values({
      url: input.url ?? null,
      title: input.title,
      organization: input.organization ?? null,
      type: input.type,
      reliability: input.reliability ?? "unverified",
      publishedAt: input.publishedAt ?? null,
      retrievedAt: input.retrievedAt ?? new Date(),
      version: input.version ?? null,
      notes: input.notes ?? null,
      addedById: input.addedById,
    })
    .returning();
  return row;
}
