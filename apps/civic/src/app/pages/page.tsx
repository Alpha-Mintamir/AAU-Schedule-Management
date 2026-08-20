import type { Metadata } from "next";
import Link from "next/link";
import { ScrollText } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { EmptyState } from "@/components/ui/empty-state";
import { VerificationBadge } from "@/components/verification-badge";
import { lt } from "@/lib/i18n";
import { listPublishedPages } from "@/lib/services/pages";
import { getCategoryBySlug, listCategories } from "@/lib/services/taxonomy";
import { timeAgo, truncate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Knowledge guides",
  description:
    "Community-maintained guides to Ethiopian civic topics: TIN, business registration, housing, documents and more.",
};

export const revalidate = 300;

export default async function PagesIndex({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const category = params.category ? await getCategoryBySlug(params.category) : null;
  const [rows, categories] = await Promise.all([
    listPublishedPages({ categoryId: category?.id }),
    listCategories(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Guides" }]} />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Knowledge guides</h1>
          <p className="mt-1 max-w-2xl text-stone-600">
            Wikipedia-style guides to Ethiopian civic topics, maintained by the community with
            cited official sources.
          </p>
        </div>
        <Link
          href="/contribute/new-page"
          className="rounded-md bg-primary-50 px-3 py-2 text-sm font-medium text-primary-800 hover:bg-primary-100"
        >
          Suggest a new guide
        </Link>
      </div>

      <nav aria-label="Filter by category" className="mb-6 overflow-x-auto">
        <ul className="flex gap-1.5">
          <li>
            <Link
              href="/pages"
              aria-current={!category ? "page" : undefined}
              className={
                !category
                  ? "inline-block rounded-full bg-primary-700 px-3 py-1 text-xs font-medium text-white"
                  : "inline-block rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-stone-600 hover:border-primary-300"
              }
            >
              All
            </Link>
          </li>
          {categories.map((c) => (
            <li key={c.id}>
              <Link
                href={`/pages?category=${c.slug}`}
                aria-current={category?.id === c.id ? "page" : undefined}
                className={
                  category?.id === c.id
                    ? "inline-block rounded-full bg-primary-700 px-3 py-1 text-xs font-medium text-white"
                    : "inline-block rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-stone-600 hover:border-primary-300"
                }
              >
                {lt(c.name)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {rows.length === 0 ? (
        <EmptyState
          title="No guides here yet"
          description="Help build the knowledge base by suggesting a guide on this topic."
          action={
            <Link
              href="/contribute/new-page"
              className="text-sm font-medium text-primary-700 hover:underline"
            >
              Suggest a new guide →
            </Link>
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {rows.map(({ page, categoryName }) => (
            <li key={page.id}>
              <Link
                href={`/pages/${page.slug}`}
                className="group block h-full rounded-lg border border-stone-200 bg-white p-4 shadow-sm hover:border-primary-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <ScrollText aria-hidden="true" className="size-5 text-primary-700" />
                  <VerificationBadge status={page.verificationStatus} />
                </div>
                <h2 className="mt-2 font-semibold text-stone-900 group-hover:text-primary-800">
                  {lt(page.title)}
                  {page.title.am ? (
                    <span className="ml-2 font-normal text-stone-400" lang="am">
                      {page.title.am}
                    </span>
                  ) : null}
                </h2>
                <p className="mt-1 text-sm text-stone-500">{truncate(lt(page.summary), 140)}</p>
                <p className="mt-3 flex flex-wrap gap-x-3 text-xs text-stone-400">
                  <span>Updated {timeAgo(page.updatedAt)}</span>
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
