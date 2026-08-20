import type { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { lt } from "@/lib/i18n";
import { listPublishedDocuments } from "@/lib/services/documents";
import { getCategoryBySlug, listCategories } from "@/lib/services/taxonomy";
import { truncate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Documents & templates",
  description:
    "Ethiopian government forms, contracts, agreements and community templates — with clear official/community labeling.",
};

export const revalidate = 300;

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; layer?: string }>;
}) {
  const params = await searchParams;
  const category = params.category ? await getCategoryBySlug(params.category) : null;
  const layer =
    params.layer === "official" || params.layer === "community" ? params.layer : undefined;

  const [rows, categories] = await Promise.all([
    listPublishedDocuments({ categoryId: category?.id, layer }),
    listCategories(),
  ]);

  const filterHref = (categorySlug?: string, layerValue?: string) => {
    const query = new URLSearchParams();
    if (categorySlug) query.set("category", categorySlug);
    if (layerValue) query.set("layer", layerValue);
    const qs = query.toString();
    return `/documents${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Documents" }]} />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Documents &amp; templates</h1>
        <p className="mt-1 max-w-2xl text-stone-600">
          Government forms and community templates. A{" "}
          <Badge variant="official">Official</Badge> badge means the file comes from a government
          source; <Badge variant="community">Community template</Badge> means it was created by
          contributors and is <strong>not</strong> an official document.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <nav aria-label="Filter by origin">
          <ul className="flex gap-1.5">
            {[
              { value: undefined, label: "All" },
              { value: "official", label: "Official" },
              { value: "community", label: "Community templates" },
            ].map((option) => (
              <li key={option.label}>
                <Link
                  href={filterHref(category?.slug, option.value)}
                  aria-current={layer === option.value ? "page" : undefined}
                  className={
                    layer === option.value
                      ? "inline-block rounded-full bg-primary-700 px-3 py-1 text-xs font-medium text-white"
                      : "inline-block rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-stone-600 hover:border-primary-300"
                  }
                >
                  {option.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Filter by category" className="overflow-x-auto">
          <ul className="flex gap-1.5">
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={filterHref(category?.id === c.id ? undefined : c.slug, layer)}
                  aria-current={category?.id === c.id ? "page" : undefined}
                  className={
                    category?.id === c.id
                      ? "inline-block rounded-full bg-stone-800 px-3 py-1 text-xs font-medium text-white"
                      : "inline-block rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-stone-600 hover:border-primary-300"
                  }
                >
                  {lt(c.name)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No documents match these filters"
          description="Have a useful form or template? Share it with the community."
          action={
            <Link
              href="/contribute/document"
              className="text-sm font-medium text-primary-700 hover:underline"
            >
              Submit a document →
            </Link>
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {rows.map(({ document, categoryName, organizationName }) => (
            <li key={document.id}>
              <Link
                href={`/documents/${document.slug}`}
                className="group block h-full rounded-lg border border-stone-200 bg-white p-4 shadow-sm hover:border-primary-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <FileText aria-hidden="true" className="size-5 text-primary-700" />
                  <Badge variant={document.layer === "official" ? "official" : "community"}>
                    {document.layer === "official" ? "Official" : "Community template"}
                  </Badge>
                </div>
                <h2 className="mt-2 font-semibold text-stone-900 group-hover:text-primary-800">
                  {lt(document.title)}
                </h2>
                {document.description ? (
                  <p className="mt-1 text-sm text-stone-500">
                    {truncate(lt(document.description), 120)}
                  </p>
                ) : null}
                <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-stone-400">
                  <span className="uppercase">{document.docType}</span>
                  <span className="uppercase">{document.language}</span>
                  {organizationName ? <span>{lt(organizationName)}</span> : null}
                  {categoryName ? <span>{lt(categoryName)}</span> : null}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
