import type { Metadata } from "next";
import Link from "next/link";
import { Building2, MapPin } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { EmptyState } from "@/components/ui/empty-state";
import { VerificationBadge } from "@/components/verification-badge";
import { lt } from "@/lib/i18n";
import { getLocationBySlug, listLocations } from "@/lib/services/locations";
import { listPublishedOffices } from "@/lib/services/offices";

export const metadata: Metadata = {
  title: "Government office directory",
  description:
    "Directory of Ethiopian government offices: locations, services, opening hours and community reports.",
};

export const revalidate = 300;

export default async function OfficesPage({
  searchParams,
}: {
  searchParams: Promise<{ location?: string }>;
}) {
  const params = await searchParams;
  const locationFilter = params.location ? await getLocationBySlug(params.location) : null;
  const [rows, locations] = await Promise.all([
    listPublishedOffices({ locationRootId: locationFilter?.id }),
    listLocations(),
  ]);
  const filterOptions = locations.filter((l) => l.type === "region" || l.type === "city");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Offices" }]} />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Government office directory</h1>
        <p className="mt-1 max-w-2xl text-stone-600">
          Where to go, what each office actually does, and what the community reports about it.
        </p>
      </div>

      <nav aria-label="Filter by location" className="mb-6 overflow-x-auto">
        <ul className="flex gap-1.5">
          <li>
            <Link
              href="/offices"
              aria-current={!locationFilter ? "page" : undefined}
              className={
                !locationFilter
                  ? "inline-block rounded-full bg-primary-700 px-3 py-1 text-xs font-medium text-white"
                  : "inline-block rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-stone-600 hover:border-primary-300"
              }
            >
              All locations
            </Link>
          </li>
          {filterOptions.map((location) => (
            <li key={location.id}>
              <Link
                href={`/offices?location=${location.slug}`}
                aria-current={locationFilter?.id === location.id ? "page" : undefined}
                className={
                  locationFilter?.id === location.id
                    ? "inline-block rounded-full bg-primary-700 px-3 py-1 text-xs font-medium text-white"
                    : "inline-block rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-stone-600 hover:border-primary-300"
                }
              >
                {lt(location.name)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {rows.length === 0 ? (
        <EmptyState
          title="No offices listed here yet"
          description="Know an office that should be listed? Contributors can suggest new offices."
          action={
            <Link href="/contribute" className="text-sm font-medium text-primary-700 hover:underline">
              Contribute →
            </Link>
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {rows.map(({ office, organizationName, locationName, locationSlug }) => (
            <li key={office.id}>
              <Link
                href={`/offices/${office.slug}`}
                className="group block h-full rounded-lg border border-stone-200 bg-white p-4 shadow-sm hover:border-primary-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <Building2 aria-hidden="true" className="size-5 text-primary-700" />
                  <VerificationBadge status={office.verificationStatus} />
                </div>
                <h2 className="mt-2 font-semibold text-stone-900 group-hover:text-primary-800">
                  {lt(office.name)}
                </h2>
                {organizationName ? (
                  <p className="mt-0.5 text-sm text-stone-500">{lt(organizationName)}</p>
                ) : null}
                {locationName ? (
                  <p className="mt-2 flex items-center gap-1 text-xs text-stone-400">
                    <MapPin aria-hidden="true" className="size-3" />
                    {lt(locationName)}
                    {locationSlug ? "" : ""}
                  </p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
