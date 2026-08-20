import type { Metadata } from "next";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { lt } from "@/lib/i18n";
import { listLocations, type LocationRow } from "@/lib/services/locations";

export const metadata: Metadata = {
  title: "Browse by location",
  description: "Find government offices, processes and guides by Ethiopian region, city, sub-city and woreda.",
};

export const revalidate = 3600;

const TYPE_LABELS: Record<string, string> = {
  country: "Country",
  region: "Region",
  city: "City",
  subcity: "Sub-city",
  woreda: "Woreda",
};

function LocationNode({
  location,
  childrenByParent,
  depth,
}: {
  location: LocationRow;
  childrenByParent: Map<string, LocationRow[]>;
  depth: number;
}) {
  const children = childrenByParent.get(location.id) ?? [];
  return (
    <li>
      <Link
        href={`/locations/${location.slug}`}
        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-stone-700 hover:bg-stone-50 hover:text-primary-800"
      >
        <MapPin aria-hidden="true" className="size-3.5 shrink-0 text-stone-400" />
        <span className="font-medium">{lt(location.name)}</span>
        <span className="text-xs text-stone-400">{TYPE_LABELS[location.type]}</span>
      </Link>
      {children.length > 0 && depth < 4 ? (
        <ul className="ml-5 border-l border-stone-100 pl-2">
          {children.map((child) => (
            <LocationNode
              key={child.id}
              location={child}
              childrenByParent={childrenByParent}
              depth={depth + 1}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export default async function LocationsPage() {
  const locations = await listLocations();
  const childrenByParent = new Map<string, LocationRow[]>();
  for (const location of locations) {
    if (!location.parentId) continue;
    const list = childrenByParent.get(location.parentId) ?? [];
    list.push(location);
    childrenByParent.set(location.parentId, list);
  }
  const roots = locations.filter((l) => !l.parentId);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Locations" }]} />
      <h1 className="text-2xl font-bold text-stone-900">Browse by location</h1>
      <p className="mt-1 mb-6 max-w-2xl text-stone-600">
        Ethiopia&apos;s administrative hierarchy: country → region → city → sub-city → woreda.
        Every level can hold offices, processes and guides.
      </p>
      <div className="rounded-lg border border-stone-200 bg-white p-4">
        <ul>
          {roots.map((root) => (
            <LocationNode key={root.id} location={root} childrenByParent={childrenByParent} depth={0} />
          ))}
        </ul>
      </div>
    </div>
  );
}
