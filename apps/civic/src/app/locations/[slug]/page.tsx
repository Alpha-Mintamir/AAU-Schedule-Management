import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, MapPin, Route } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VerificationBadge } from "@/components/verification-badge";
import { lt } from "@/lib/i18n";
import {
  getLocationAncestry,
  getLocationBySlug,
  listChildren,
} from "@/lib/services/locations";
import { listPublishedOffices } from "@/lib/services/offices";
import { listPublishedProcesses } from "@/lib/services/processes";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const location = await getLocationBySlug(slug);
  if (!location) return { title: "Location not found" };
  return {
    title: lt(location.name),
    description: `Government offices, processes and guides for ${lt(location.name)}.`,
    alternates: { canonical: `/locations/${location.slug}` },
  };
}

const TYPE_LABELS: Record<string, string> = {
  country: "Country",
  region: "Region",
  city: "City",
  subcity: "Sub-city",
  woreda: "Woreda",
};

export default async function LocationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const location = await getLocationBySlug(slug);
  if (!location) notFound();

  const [ancestry, children, offices, processes] = await Promise.all([
    getLocationAncestry(location),
    listChildren(location.id),
    listPublishedOffices({ locationRootId: location.id, limit: 20 }),
    listPublishedProcesses({ locationId: location.id, limit: 20 }),
  ]);

  const crumbs = ancestry.slice(0, -1).map((node) => ({
    label: lt(node.name),
    href: `/locations/${node.slug}`,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Locations", href: "/locations" }, ...crumbs, { label: lt(location.name) }]} />

      <header className="mb-6">
        <p className="text-sm font-medium text-primary-700 uppercase">{TYPE_LABELS[location.type]}</p>
        <h1 className="text-2xl font-bold text-stone-900 sm:text-3xl">{lt(location.name)}</h1>
        {location.name.am ? (
          <p className="mt-0.5 text-lg text-stone-500" lang="am">
            {location.name.am}
          </p>
        ) : null}
        {location.description ? (
          <p className="mt-2 max-w-3xl text-stone-600">{lt(location.description)}</p>
        ) : null}
      </header>

      <div className="space-y-8">
        {children.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Areas within {lt(location.name)}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-wrap gap-2">
                {children.map((child) => (
                  <li key={child.id}>
                    <Link
                      href={`/locations/${child.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-md border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-700 hover:border-primary-300"
                    >
                      <MapPin aria-hidden="true" className="size-3.5 text-stone-400" />
                      {lt(child.name)}
                      <span className="text-xs text-stone-400">{TYPE_LABELS[child.type]}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}

        <section>
          <h2 className="mb-3 text-lg font-semibold text-stone-900">Government offices</h2>
          {offices.length === 0 ? (
            <p className="rounded-md border border-dashed border-stone-300 bg-white px-4 py-6 text-center text-sm text-stone-500">
              No offices listed in this area yet.
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {offices.map(({ office, organizationName }) => (
                <li key={office.id}>
                  <Link
                    href={`/offices/${office.slug}`}
                    className="flex h-full items-start gap-3 rounded-lg border border-stone-200 bg-white p-4 hover:border-primary-300"
                  >
                    <Building2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary-700" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-stone-800">{lt(office.name)}</span>
                      {organizationName ? (
                        <span className="mt-0.5 block truncate text-xs text-stone-500">
                          {lt(organizationName)}
                        </span>
                      ) : null}
                    </span>
                    <VerificationBadge status={office.verificationStatus} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-stone-900">Processes in this area</h2>
          {processes.length === 0 ? (
            <p className="rounded-md border border-dashed border-stone-300 bg-white px-4 py-6 text-center text-sm text-stone-500">
              No location-specific processes documented yet.
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {processes.map(({ process }) => (
                <li key={process.id}>
                  <Link
                    href={`/processes/${process.slug}`}
                    className="flex h-full items-start gap-3 rounded-lg border border-stone-200 bg-white p-4 hover:border-primary-300"
                  >
                    <Route aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary-700" />
                    <span className="min-w-0 flex-1 font-medium text-stone-800">
                      {lt(process.title)}
                    </span>
                    <VerificationBadge status={process.verificationStatus} />
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
