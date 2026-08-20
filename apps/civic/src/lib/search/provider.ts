import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import type { Locale } from "@/lib/i18n";

/**
 * Search abstraction. The application talks to `SearchProvider` only; the
 * default implementation uses PostgreSQL full-text search + trigram
 * similarity over the denormalized search_documents table. A future
 * Elasticsearch/OpenSearch/Typesense provider implements the same interface
 * and is swapped in `getSearchProvider` without touching callers.
 */

export type SearchEntityType =
  | "knowledge_page"
  | "process"
  | "office"
  | "document"
  | "organization"
  | "location";

export interface SearchQuery {
  q: string;
  types?: SearchEntityType[];
  locale?: Locale;
  limit?: number;
  offset?: number;
}

export interface SearchHit {
  entityType: SearchEntityType;
  entityId: string;
  slug: string;
  url: string;
  title: string;
  summary: string | null;
  verificationStatus: string;
  rank: number;
}

export interface SearchResult {
  hits: SearchHit[];
  total: number;
}

export interface SearchProvider {
  search(query: SearchQuery): Promise<SearchResult>;
}

const MAX_QUERY_LENGTH = 200;

class PostgresSearchProvider implements SearchProvider {
  async search(query: SearchQuery): Promise<SearchResult> {
    const q = query.q.trim().slice(0, MAX_QUERY_LENGTH);
    if (q.length === 0) return { hits: [], total: 0 };

    const limit = Math.min(Math.max(query.limit ?? 20, 1), 50);
    const offset = Math.max(query.offset ?? 0, 0);

    const typeFilter =
      query.types && query.types.length > 0
        ? sql` AND sd.entity_type = ANY(ARRAY[${sql.join(
            query.types.map((t) => sql`${t}`),
            sql`, `,
          )}]::entity_type[])`
        : sql``;

    // Full-text match (simple config covers Amharic + acronyms; english config
    // covers stemmed English) combined with trigram similarity so misspellings
    // and alternate spellings still surface results. Deduplicate per entity
    // across locales, keeping the best-ranked locale document.
    const rows = await db.execute(sql`
      WITH matches AS (
        SELECT
          sd.entity_type,
          sd.entity_id,
          sd.slug,
          sd.url,
          sd.title,
          sd.summary,
          sd.verification_status,
          (
            COALESCE(ts_rank_cd(sd.tsv, websearch_to_tsquery('simple', ${q})), 0) * 2 +
            COALESCE(ts_rank_cd(sd.tsv, websearch_to_tsquery('english', ${q})), 0) * 2 +
            GREATEST(similarity(sd.title, ${q}), similarity(COALESCE(sd.keywords, ''), ${q}))
          ) AS rank
        FROM search_documents sd
        WHERE (
          sd.tsv @@ websearch_to_tsquery('simple', ${q})
          OR sd.tsv @@ websearch_to_tsquery('english', ${q})
          OR similarity(sd.title, ${q}) > 0.2
          OR similarity(COALESCE(sd.keywords, ''), ${q}) > 0.2
        )${typeFilter}
      ),
      deduped AS (
        SELECT DISTINCT ON (entity_type, entity_id) *
        FROM matches
        ORDER BY entity_type, entity_id, rank DESC
      )
      SELECT *, COUNT(*) OVER() AS total
      FROM deduped
      ORDER BY rank DESC, title ASC
      LIMIT ${limit} OFFSET ${offset}
    `);

    const list = rows as unknown as Array<{
      entity_type: SearchEntityType;
      entity_id: string;
      slug: string;
      url: string;
      title: string;
      summary: string | null;
      verification_status: string;
      rank: number;
      total: string;
    }>;

    return {
      hits: list.map((row) => ({
        entityType: row.entity_type,
        entityId: row.entity_id,
        slug: row.slug,
        url: row.url,
        title: row.title,
        summary: row.summary,
        verificationStatus: row.verification_status,
        rank: Number(row.rank),
      })),
      total: list.length > 0 ? Number(list[0].total) : 0,
    };
  }
}

let provider: SearchProvider | null = null;

export function getSearchProvider(): SearchProvider {
  provider ??= new PostgresSearchProvider();
  return provider;
}
