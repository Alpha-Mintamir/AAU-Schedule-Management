import type { Metadata } from "next";
import Link from "next/link";
import { Route } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { EmptyState } from "@/components/ui/empty-state";
import { VerificationBadge } from "@/components/verification-badge";
import { lt } from "@/lib/i18n";
import { listPublishedProcesses } from "@/lib/services/processes";
import { getCategoryBySlug, listCategories } from "@/lib/services/taxonomy";
import { truncate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Administrative processes",
  description:
    "Step-by-step guides to Ethiopian administrative processes: business registration, TIN, licenses, vehicle transfer and more.",
};

export const revalidate = 300;

const COMPLEXITY_LABELS: Record<string, string> = {
  simple: "Simple",
  moderate: "Moderate",
  complex: "Complex",
  very_complex: "Very complex",
};

export default async function ProcessesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const category = params.category ? await getCategoryBySlug(params.category) : null;
  const [rows, categories] = await Promise.all([
    listPublishedProcesses({ categoryId: category?.id }),
    listCategories(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Processes" }]} />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Administrative processes</h1>
        <p className="mt-1 max-w-2xl text-stone-600">
          Step-by-step documentation of how administrative processes actually work — the
          official procedure and what people experienced, side by side.
        </p>
      </div>

      <nav aria-label="Filter by category" className="mb-6 overflow-x-auto">
        <ul className="flex gap-1.5">
          <li>
            <Link
              href="/processes"
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
                href={`/processes?category=${c.slug}`}
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
          title="No processes documented in this category yet"
          description="Know how a process works? Help others by contributing a guide."
          action={
            <Link href="/contribute" className="text-sm font-medium text-primary-700 hover:underline">
              Contribute →
            </Link>
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {rows.map(({ process, categoryName, locationName }) => (
            <li key={process.id}>
              <Link
                href={`/processes/${process.slug}`}
                className="group block h-full rounded-lg border border-stone-200 bg-white p-4 shadow-sm hover:border-primary-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <Route aria-hidden="true" className="size-5 text-primary-700" />
                  <VerificationBadge status={process.verificationStatus} />
                </div>
                <h2 className="mt-2 font-semibold text-stone-900 group-hover:text-primary-800">
                  {lt(process.title)}
                </h2>
                <p className="mt-1 text-sm text-stone-500">{truncate(lt(process.summary), 140)}</p>
                <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-stone-400">
                  <span>Complexity: {COMPLEXITY_LABELS[process.complexity]}</span>
                  {categoryName ? <span>{lt(categoryName)}</span> : null}
                  {locationName ? <span>{lt(locationName)}</span> : null}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
