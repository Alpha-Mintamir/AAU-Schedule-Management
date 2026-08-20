import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, ExternalLink, Globe, Mail, MapPin, Phone } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CommunitySection } from "@/components/community/community-section";
import { ReportDialog } from "@/components/community/report-dialog";
import { VerifyControls } from "@/components/community/verify-controls";
import { JsonLd } from "@/components/json-ld";
import { RelatedList } from "@/components/related-list";
import { SourcesList } from "@/components/sources-list";
import { TrustBar } from "@/components/trust-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayerBadge } from "@/components/verification-badge";
import { hasPermission } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import { lt } from "@/lib/i18n";
import { getLocationAncestry } from "@/lib/services/locations";
import { countPublishedNotes } from "@/lib/services/notes";
import { getOfficeBySlug } from "@/lib/services/offices";
import { listRelated } from "@/lib/services/related";
import { listCitationsForEntity } from "@/lib/services/sources";
import { truncate } from "@/lib/utils";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getOfficeBySlug(slug);
  if (!detail) return { title: "Office not found" };
  return {
    title: lt(detail.office.name),
    description: truncate(
      `${lt(detail.office.name)} — services, location, opening hours and community reports.`,
      160,
    ),
    alternates: { canonical: `/offices/${detail.office.slug}` },
  };
}

export default async function OfficeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = await getOfficeBySlug(slug);
  if (!detail) notFound();

  const { office, organization, location, services } = detail;
  const [citations, related, noteCount, user, ancestry] = await Promise.all([
    listCitationsForEntity("office", office.id),
    listRelated("office", office.id),
    countPublishedNotes("office", office.id),
    getCurrentUser(),
    location ? getLocationAncestry(location) : Promise.resolve([]),
  ]);

  const canVerify = hasPermission(user?.role, "moderation:verify_content");
  const canMarkState = hasPermission(user?.role, "moderation:mark_outdated");

  const officialServices = services.filter((s) => s.layer === "official");
  const communityServices = services.filter((s) => s.layer === "community");

  const hasCoords = office.latitude !== null && office.longitude !== null;
  const osmLink = hasCoords
    ? `https://www.openstreetmap.org/?mlat=${office.latitude}&mlon=${office.longitude}#map=17/${office.latitude}/${office.longitude}`
    : null;
  const gmapsLink = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${office.latitude},${office.longitude}`
    : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "GovernmentOffice",
    name: lt(office.name),
    ...(office.address ? { address: lt(office.address) } : {}),
    ...(office.phone ? { telephone: office.phone } : {}),
    ...(hasCoords
      ? { geo: { "@type": "GeoCoordinates", latitude: office.latitude, longitude: office.longitude } }
      : {}),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <JsonLd data={jsonLd} />
      <Breadcrumbs items={[{ label: "Offices", href: "/offices" }, { label: lt(office.name) }]} />

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900 sm:text-3xl">{lt(office.name)}</h1>
        {office.name.am ? (
          <p className="mt-0.5 text-lg text-stone-500" lang="am">
            {office.name.am}
          </p>
        ) : null}
        {organization ? (
          <p className="mt-1 text-stone-600">
            {lt(organization.name)}
            {office.officeType ? ` · ${office.officeType}` : ""}
          </p>
        ) : null}
        <div className="mt-3">
          <TrustBar
            verificationStatus={office.verificationStatus}
            lastVerifiedAt={office.lastVerifiedAt}
            communityReportCount={noteCount}
          />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-6">
          {/* Official information */}
          <Card>
            <CardHeader className="flex items-center justify-between gap-3">
              <CardTitle>Official information</CardTitle>
              <LayerBadge layer="official" />
            </CardHeader>
            <CardContent>
              <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
                {office.address ? (
                  <div className="sm:col-span-2">
                    <dt className="flex items-center gap-1.5 font-medium text-stone-800">
                      <MapPin aria-hidden="true" className="size-4 text-stone-400" /> Address
                    </dt>
                    <dd className="mt-0.5 text-stone-600">
                      {lt(office.address)}
                      {ancestry.length > 0 ? (
                        <span className="mt-1 block text-xs text-stone-400">
                          {ancestry.map((a) => lt(a.name)).join(" → ")}
                        </span>
                      ) : null}
                    </dd>
                  </div>
                ) : null}
                {office.phone ? (
                  <div>
                    <dt className="flex items-center gap-1.5 font-medium text-stone-800">
                      <Phone aria-hidden="true" className="size-4 text-stone-400" /> Phone
                    </dt>
                    <dd className="mt-0.5 text-stone-600">
                      <a href={`tel:${office.phone}`} className="hover:text-primary-700 hover:underline">
                        {office.phone}
                      </a>
                    </dd>
                  </div>
                ) : null}
                {office.email ? (
                  <div>
                    <dt className="flex items-center gap-1.5 font-medium text-stone-800">
                      <Mail aria-hidden="true" className="size-4 text-stone-400" /> Email
                    </dt>
                    <dd className="mt-0.5 text-stone-600">
                      <a href={`mailto:${office.email}`} className="hover:text-primary-700 hover:underline">
                        {office.email}
                      </a>
                    </dd>
                  </div>
                ) : null}
                {office.website ? (
                  <div>
                    <dt className="flex items-center gap-1.5 font-medium text-stone-800">
                      <Globe aria-hidden="true" className="size-4 text-stone-400" /> Website
                    </dt>
                    <dd className="mt-0.5 text-stone-600">
                      <a
                        href={office.website}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="text-primary-700 hover:underline"
                      >
                        {office.website.replace(/^https?:\/\//, "")}
                        <ExternalLink aria-hidden="true" className="ml-1 inline size-3" />
                      </a>
                    </dd>
                  </div>
                ) : null}
                {office.openingHours ? (
                  <div>
                    <dt className="flex items-center gap-1.5 font-medium text-stone-800">
                      <Clock aria-hidden="true" className="size-4 text-stone-400" /> Opening hours
                    </dt>
                    <dd className="mt-0.5 space-y-0.5 text-stone-600">
                      {Object.entries(office.openingHours).map(([days, hours]) => (
                        <p key={days}>
                          <span className="capitalize">{days}</span>: {hours}
                        </p>
                      ))}
                    </dd>
                  </div>
                ) : null}
              </dl>
              {(osmLink || gmapsLink) && (
                <p className="mt-4 flex flex-wrap gap-3 text-sm">
                  {gmapsLink ? (
                    <a
                      href={gmapsLink}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="font-medium text-primary-700 hover:underline"
                    >
                      Open in Google Maps
                    </a>
                  ) : null}
                  {osmLink ? (
                    <a
                      href={osmLink}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="font-medium text-primary-700 hover:underline"
                    >
                      Open in OpenStreetMap
                    </a>
                  ) : null}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Services */}
          {services.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Services</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {officialServices.length > 0 ? (
                  <div>
                    <p className="mb-2 text-sm text-stone-600">
                      <LayerBadge layer="official" />{" "}
                      <span className="ml-1">Officially listed services:</span>
                    </p>
                    <ul className="grid gap-1.5 text-sm text-stone-700 sm:grid-cols-2">
                      {officialServices.map((service) => (
                        <li key={service.id} className="rounded-md bg-stone-50 px-3 py-2">
                          {lt(service.name)}
                          {service.description ? (
                            <span className="mt-0.5 block text-xs text-stone-500">
                              {lt(service.description)}
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {communityServices.length > 0 ? (
                  <div>
                    <p className="mb-2 text-sm text-stone-600">
                      <LayerBadge layer="community" />{" "}
                      <span className="ml-1">Community-reported services:</span>
                    </p>
                    <ul className="grid gap-1.5 text-sm text-stone-700 sm:grid-cols-2">
                      {communityServices.map((service) => (
                        <li key={service.id} className="rounded-md bg-accent-50 px-3 py-2">
                          {lt(service.name)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {/* Community reports: moved / hours changed / no longer provides */}
          <CommunitySection
            entityType="office"
            entityId={office.id}
            currentPath={`/offices/${office.slug}`}
          />

          <SourcesList citations={citations} />

          <ReportDialog entityType="office" entityId={office.id} isSignedIn={user !== null} />

          {canVerify ? (
            <VerifyControls entityType="office" entityId={office.id} canMarkState={canMarkState} />
          ) : null}
        </div>

        <aside className="space-y-4">
          {location ? (
            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-stone-600">
                <ol className="space-y-1">
                  {ancestry.map((node) => (
                    <li key={node.id}>
                      <Link
                        href={`/locations/${node.slug}`}
                        className="text-primary-700 hover:underline"
                      >
                        {lt(node.name)}
                      </Link>
                      <span className="ml-1.5 text-xs text-stone-400 capitalize">{node.type}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          ) : null}
          <RelatedList items={related} title="Related processes & guides" />
        </aside>
      </div>
    </div>
  );
}
