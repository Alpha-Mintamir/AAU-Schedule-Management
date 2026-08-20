import type { Metadata } from "next";
import Link from "next/link";
import { Building2, FileText, MapPin, Route, ScrollText } from "lucide-react";
import { SearchBar } from "@/components/search-bar";
import { VerificationBadge } from "@/components/verification-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { getSearchProvider, type SearchEntityType } from "@/lib/search/provider";
import { truncate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Search",
  description: "Search Ethiopian administrative processes, documents, government offices and guides.",
};

const PAGE_SIZE = 20;

const TYPE_TABS: Array<{ value: SearchEntityType | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "process", label: "Processes" },
  { value: "knowledge_page", label: "Guides" },
  { value: "document", label: "Documents" },
  { value: "office", label: "Offices" },
  { value: "location", label: "Locations" },
];

const TYPE_ICONS: Record<SearchEntityType, typeof FileText> = {
  process: Route,
  knowledge_page: ScrollText,
  document: FileText,
  office: Building2,
  organization: Building2,
  location: MapPin,
};

const TYPE_LABELS: Record<SearchEntityType, string> = {
  process: "Process",
  knowledge_page: "Guide",
  document: "Document",
  office: "Office",
  organization: "Organization",
  location: "Location",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const typeParam = params.type;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const validType = TYPE_TABS.some((t) => t.value === typeParam) && typeParam !== "all"
    ? (typeParam as SearchEntityType)
    : undefined;

  const result = q
    ? await getSearchProvider().search({
        q,
        types: validType ? [validType] : undefined,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      })
    : { hits: [], total: 0 };

  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));

  const tabHref = (type: string) =>
    `/search?q=${encodeURIComponent(q)}${type === "all" ? "" : `&type=${type}`}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="sr-only">Search</h1>
      <SearchBar defaultValue={q} size="lg" autoFocus={!q} />

      {q ? (
        <>
          <nav aria-label="Filter results by type" className="mt-4 overflow-x-auto">
            <ul className="flex gap-1.5">
              {TYPE_TABS.map((tab) => {
                const active =
                  tab.value === "all" ? !validType : validType === tab.value;
                return (
                  <li key={tab.value}>
                    <Link
                      href={tabHref(tab.value)}
                      aria-current={active ? "page" : undefined}
                      className={
                        active
                          ? "inline-block rounded-full bg-primary-700 px-3 py-1 text-xs font-medium text-white"
                          : "inline-block rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-stone-600 hover:border-primary-300"
                      }
                    >
                      {tab.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <p className="mt-4 text-sm text-stone-500" role="status">
            {result.total === 0
              ? `No results for “${q}”.`
              : `${result.total} result${result.total === 1 ? "" : "s"} for “${q}”`}
          </p>

          {result.hits.length === 0 ? (
            <EmptyState
              className="mt-4"
              title="Nothing found"
              description="Try different words, an acronym (e.g. TIN), or the Amharic name. You can also contribute a new guide if this topic is missing."
              action={
                <Link href="/contribute/new-page" className="text-sm font-medium text-primary-700 hover:underline">
                  Suggest a new guide →
                </Link>
              }
            />
          ) : (
            <ol className="mt-4 space-y-3">
              {result.hits.map((hit) => {
                const Icon = TYPE_ICONS[hit.entityType];
                return (
                  <li key={`${hit.entityType}-${hit.entityId}`}>
                    <Link
                      href={hit.url}
                      className="block rounded-lg border border-stone-200 bg-white p-4 hover:border-primary-300"
                    >
                      <div className="flex items-center gap-2 text-xs text-stone-400">
                        <Icon aria-hidden="true" className="size-3.5" />
                        <span>{TYPE_LABELS[hit.entityType]}</span>
                        <span className="ml-auto">
                          <VerificationBadge status={hit.verificationStatus} />
                        </span>
                      </div>
                      <h2 className="mt-1 font-medium text-stone-900">{hit.title}</h2>
                      {hit.summary ? (
                        <p className="mt-0.5 text-sm text-stone-500">{truncate(hit.summary, 160)}</p>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ol>
          )}

          {totalPages > 1 ? (
            <nav aria-label="Search pagination" className="mt-6 flex items-center justify-between text-sm">
              {page > 1 ? (
                <Link
                  className="font-medium text-primary-700 hover:underline"
                  href={`${tabHref(validType ?? "all")}&page=${page - 1}`}
                >
                  ← Previous
                </Link>
              ) : (
                <span />
              )}
              <span className="text-stone-500">
                Page {page} of {totalPages}
              </span>
              {page < totalPages ? (
                <Link
                  className="font-medium text-primary-700 hover:underline"
                  href={`${tabHref(validType ?? "all")}&page=${page + 1}`}
                >
                  Next →
                </Link>
              ) : (
                <span />
              )}
            </nav>
          ) : null}
        </>
      ) : (
        <div className="mt-8 text-center text-sm text-stone-500">
          <p>
            Search across processes, guides, documents, government offices and locations — in
            English or Amharic (አማርኛ).
          </p>
        </div>
      )}
    </div>
  );
}
