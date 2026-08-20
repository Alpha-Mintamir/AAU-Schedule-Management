-- Full-text search infrastructure for search_documents.
--
-- * pg_trgm powers typo-tolerant similarity matching on titles/keywords.
-- * The generated tsvector column combines:
--     - 'simple' config for title + keywords (weight A): language-agnostic,
--       works for Amharic/Ge'ez script and acronyms without stemming.
--     - 'english' config for summary (B) and body (C): stemmed English text.
--   Additional language configurations can be added later without schema
--   changes because queries go through the search provider abstraction.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE "search_documents"
  ADD COLUMN "tsv" tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce("title", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce("keywords", '')), 'A') ||
    setweight(to_tsvector('english', coalesce("summary", '')), 'B') ||
    setweight(to_tsvector('english', coalesce("body", '')), 'C')
  ) STORED;

CREATE INDEX "search_documents_tsv_idx" ON "search_documents" USING gin ("tsv");

CREATE INDEX "search_documents_title_trgm_idx" ON "search_documents" USING gin ("title" gin_trgm_ops);

CREATE INDEX "search_documents_keywords_trgm_idx" ON "search_documents" USING gin ("keywords" gin_trgm_ops);
