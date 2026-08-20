import {
  ArrowRight,
  Building2,
  FileText,
  FolderOpen,
  MapPin,
  Route,
  Users,
} from "lucide-react";
import Link from "next/link";
import { SearchBar } from "@/components/search-bar";
import { VerificationBadge } from "@/components/verification-badge";
import { Badge } from "@/components/ui/badge";
import { lt } from "@/lib/i18n";
import { listRecentDocuments } from "@/lib/services/documents";
import { listPopularOffices } from "@/lib/services/offices";
import { listPopularProcesses } from "@/lib/services/processes";
import { listRecentlyUpdatedPages, listRecentlyVerifiedPages } from "@/lib/services/pages";
import { listCategories } from "@/lib/services/taxonomy";
import { listLocations } from "@/lib/services/locations";
import { listRecentCommunityActivity } from "@/lib/services/stats";
import { formatMonthYear, timeAgo, truncate } from "@/lib/utils";

export const revalidate = 300;

const EXAMPLE_SEARCHES = [
  "How to create a PLC",
  "Addis Ababa rental contract",
  "How to get TIN",
  "Vehicle transfer",
  "Power of attorney",
  "Where do I authenticate documents?",
  "How to renew a trade license?",
];

function SectionHeading({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-4">
      <h2 className="text-lg font-semibold text-stone-900">{title}</h2>
      {href ? (
        <Link
          href={href}
          className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary-700 hover:underline"
        >
          {linkLabel ?? "View all"} <ArrowRight aria-hidden="true" className="size-3.5" />
        </Link>
      ) : null}
    </div>
  );
}

export default async function HomePage() {
  const [processes, documents, offices, updatedPages, verifiedPages, categories, locations, activity] =
    await Promise.all([
      listPopularProcesses(6),
      listRecentDocuments(6),
      listPopularOffices(6),
      listRecentlyUpdatedPages(5),
      listRecentlyVerifiedPages(5),
      listCategories(),
      listLocations(),
      listRecentCommunityActivity(5),
    ]);

  const regionsAndCities = locations.filter((l) => l.type === "region" || l.type === "city");

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-12 text-center sm:py-16">
          <h1 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
            Understand how things work in Ethiopia.
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-stone-600">
            Practical, community-maintained knowledge about government procedures, offices,
            documents and everyday administrative processes — with official sources and real
            experience clearly separated.
          </p>
          <div className="mt-6">
            <SearchBar size="lg" />
          </div>
          <ul className="mt-4 flex flex-wrap justify-center gap-2" aria-label="Example searches">
            {EXAMPLE_SEARCHES.map((example) => (
              <li key={example}>
                <Link
                  href={`/search?q=${encodeURIComponent(example)}`}
                  className="inline-block rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs text-stone-600 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-800"
                >
                  {example}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-12 px-4 py-10">
        {/* Popular processes */}
        <section aria-labelledby="popular-processes">
          <SectionHeading title="Popular processes" href="/processes" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {processes.map((process) => (
              <Link
                key={process.id}
                href={`/processes/${process.slug}`}
                className="group rounded-lg border border-stone-200 bg-white p-4 shadow-sm transition-colors hover:border-primary-300"
              >
                <div className="flex items-start justify-between gap-2">
                  <Route aria-hidden="true" className="size-5 text-primary-700" />
                  <VerificationBadge status={process.verificationStatus} />
                </div>
                <h3 className="mt-2 font-medium text-stone-900 group-hover:text-primary-800">
                  {lt(process.title)}
                </h3>
                <p className="mt-1 text-sm text-stone-500">{truncate(lt(process.summary), 110)}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Documents + Offices */}
        <div className="grid gap-10 lg:grid-cols-2">
          <section aria-labelledby="popular-documents">
            <SectionHeading title="Popular documents & templates" href="/documents" />
            <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200 bg-white">
              {documents.map((doc) => (
                <li key={doc.id}>
                  <Link
                    href={`/documents/${doc.slug}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50"
                  >
                    <FileText aria-hidden="true" className="size-4 shrink-0 text-stone-400" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-stone-800">
                      {lt(doc.title)}
                    </span>
                    <Badge variant={doc.layer === "official" ? "official" : "community"}>
                      {doc.layer === "official" ? "Official" : "Community template"}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="popular-offices">
            <SectionHeading title="Government offices" href="/offices" />
            <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200 bg-white">
              {offices.map((office) => (
                <li key={office.id}>
                  <Link
                    href={`/offices/${office.slug}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50"
                  >
                    <Building2 aria-hidden="true" className="size-4 shrink-0 text-stone-400" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-stone-800">
                      {lt(office.name)}
                    </span>
                    <VerificationBadge status={office.verificationStatus} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Recently updated / verified / community activity */}
        <div className="grid gap-10 lg:grid-cols-3">
          <section aria-labelledby="recently-updated">
            <SectionHeading title="Recently updated" href="/pages" />
            <ul className="space-y-2">
              {updatedPages.map((page) => (
                <li key={page.id}>
                  <Link
                    href={`/pages/${page.slug}`}
                    className="block rounded-md border border-stone-200 bg-white px-3 py-2.5 text-sm hover:border-primary-300"
                  >
                    <span className="font-medium text-stone-800">{lt(page.title)}</span>
                    <span className="mt-0.5 block text-xs text-stone-400">
                      Updated {timeAgo(page.updatedAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="recently-verified">
            <SectionHeading title="Recently verified" />
            <ul className="space-y-2">
              {verifiedPages.map((page) => (
                <li key={page.id}>
                  <Link
                    href={`/pages/${page.slug}`}
                    className="block rounded-md border border-stone-200 bg-white px-3 py-2.5 text-sm hover:border-primary-300"
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate font-medium text-stone-800">
                        {lt(page.title)}
                      </span>
                      <VerificationBadge status={page.verificationStatus} />
                    </span>
                    <span className="mt-0.5 block text-xs text-stone-400">
                      Last verified {formatMonthYear(page.lastVerifiedAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="community-activity">
            <SectionHeading title="Community contributions" />
            {activity.length === 0 ? (
              <p className="rounded-md border border-dashed border-stone-300 bg-white px-3 py-6 text-center text-sm text-stone-500">
                No community reports yet. Be the first to share your experience.
              </p>
            ) : (
              <ul className="space-y-2">
                {activity.map(({ note, authorName }) => (
                  <li
                    key={note.id}
                    className="rounded-md border border-stone-200 bg-white px-3 py-2.5 text-sm"
                  >
                    <p className="text-stone-700">{truncate(note.body, 100)}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-stone-400">
                      <Users aria-hidden="true" className="size-3" />
                      {authorName} · {timeAgo(note.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Browse by category and location */}
        <div className="grid gap-10 lg:grid-cols-2">
          <section aria-labelledby="browse-category">
            <SectionHeading title="Browse by category" />
            <ul className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/categories/${category.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-700 hover:border-primary-300 hover:text-primary-800"
                  >
                    <FolderOpen aria-hidden="true" className="size-3.5 text-stone-400" />
                    {lt(category.name)}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="browse-location">
            <SectionHeading title="Browse by location" href="/locations" />
            <ul className="flex flex-wrap gap-2">
              {regionsAndCities.map((location) => (
                <li key={location.id}>
                  <Link
                    href={`/locations/${location.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-700 hover:border-primary-300 hover:text-primary-800"
                  >
                    <MapPin aria-hidden="true" className="size-3.5 text-stone-400" />
                    {lt(location.name)}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
