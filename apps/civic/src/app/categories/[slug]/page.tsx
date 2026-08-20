import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, Route, ScrollText } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { VerificationBadge } from "@/components/verification-badge";
import { Badge } from "@/components/ui/badge";
import { lt } from "@/lib/i18n";
import { listPublishedDocuments } from "@/lib/services/documents";
import { listPublishedPages } from "@/lib/services/pages";
import { listPublishedProcesses } from "@/lib/services/processes";
import { getCategoryBySlug } from "@/lib/services/taxonomy";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Category not found" };
  return {
    title: lt(category.name),
    description: category.description ? lt(category.description) : undefined,
    alternates: { canonical: `/categories/${category.slug}` },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const [processes, pages, documents] = await Promise.all([
    listPublishedProcesses({ categoryId: category.id, limit: 20 }),
    listPublishedPages({ categoryId: category.id, limit: 20 }),
    listPublishedDocuments({ categoryId: category.id, limit: 20 }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Categories" }, { label: lt(category.name) }]} />
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">{lt(category.name)}</h1>
        {category.description ? (
          <p className="mt-1 max-w-2xl text-stone-600">{lt(category.description)}</p>
        ) : null}
      </header>

      <div className="space-y-8">
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-stone-900">
            <Route aria-hidden="true" className="size-4 text-primary-700" /> Processes
          </h2>
          {processes.length === 0 ? (
            <p className="text-sm text-stone-500">No processes in this category yet.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {processes.map(({ process }) => (
                <li key={process.id}>
                  <Link
                    href={`/processes/${process.slug}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white p-4 hover:border-primary-300"
                  >
                    <span className="font-medium text-stone-800">{lt(process.title)}</span>
                    <VerificationBadge status={process.verificationStatus} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-stone-900">
            <ScrollText aria-hidden="true" className="size-4 text-primary-700" /> Guides
          </h2>
          {pages.length === 0 ? (
            <p className="text-sm text-stone-500">No guides in this category yet.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {pages.map(({ page }) => (
                <li key={page.id}>
                  <Link
                    href={`/pages/${page.slug}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white p-4 hover:border-primary-300"
                  >
                    <span className="font-medium text-stone-800">{lt(page.title)}</span>
                    <VerificationBadge status={page.verificationStatus} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-stone-900">
            <FileText aria-hidden="true" className="size-4 text-primary-700" /> Documents
          </h2>
          {documents.length === 0 ? (
            <p className="text-sm text-stone-500">No documents in this category yet.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {documents.map(({ document }) => (
                <li key={document.id}>
                  <Link
                    href={`/documents/${document.slug}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 bg-white p-4 hover:border-primary-300"
                  >
                    <span className="font-medium text-stone-800">{lt(document.title)}</span>
                    <Badge variant={document.layer === "official" ? "official" : "community"}>
                      {document.layer === "official" ? "Official" : "Community"}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
