import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, CircleHelp } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { CommunitySection } from "@/components/community/community-section";
import { ReportDialog } from "@/components/community/report-dialog";
import { VerifyControls } from "@/components/community/verify-controls";
import { MarkdownView } from "@/components/markdown-view";
import { RelatedList } from "@/components/related-list";
import { SourcesList } from "@/components/sources-list";
import { TrustBar } from "@/components/trust-bar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayerBadge } from "@/components/verification-badge";
import { hasPermission } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import { lt } from "@/lib/i18n";
import { countPublishedNotes } from "@/lib/services/notes";
import { getProcessBySlug } from "@/lib/services/processes";
import { listRelated } from "@/lib/services/related";
import { listCitationsForEntity } from "@/lib/services/sources";
import { formatEtb, truncate } from "@/lib/utils";

const localize = lt;

export const revalidate = 300;

const COMPLEXITY_LABELS: Record<string, string> = {
  simple: "Simple",
  moderate: "Moderate",
  complex: "Complex",
  very_complex: "Very complex",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getProcessBySlug(slug);
  if (!detail) return { title: "Process not found" };
  return {
    title: lt(detail.process.title),
    description: truncate(lt(detail.process.summary), 160),
    alternates: { canonical: `/processes/${detail.process.slug}` },
  };
}

export default async function ProcessDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = await getProcessBySlug(slug);
  if (!detail) notFound();

  const { process, steps, requirements, fees, durations, category, location } = detail;

  const [citations, related, noteCount, user] = await Promise.all([
    listCitationsForEntity("process", process.id),
    listRelated("process", process.id),
    countPublishedNotes("process", process.id),
    getCurrentUser(),
  ]);

  const canVerify = hasPermission(user?.role, "moderation:verify_content");
  const canMarkState = hasPermission(user?.role, "moderation:mark_outdated");

  const officialFees = fees.filter((f) => f.kind === "official");
  const communityFees = fees.filter((f) => f.kind === "community_reported");
  const unknownFees = fees.filter((f) => f.kind === "unknown");
  const officialDurations = durations.filter((d) => d.kind === "official");
  const communityDurations = durations.filter((d) => d.kind === "community_reported");
  const officialRequirements = requirements.filter((r) => r.layer === "official");
  const communityRequirements = requirements.filter((r) => r.layer === "community");
  const officesInvolved = [
    ...new Map(
      steps.filter((s) => s.office).map((s) => [s.office!.id, s.office!]),
    ).values(),
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: lt(process.title),
    description: lt(process.summary),
    step: steps.map((step) => ({
      "@type": "HowToStep",
      position: step.stepNumber,
      name: lt(step.title),
    })),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <JsonLd data={jsonLd} />
      <Breadcrumbs
        items={[{ label: "Processes", href: "/processes" }, { label: lt(process.title) }]}
      />

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900 sm:text-3xl">{lt(process.title)}</h1>
        {process.title.am ? (
          <p className="mt-0.5 text-lg text-stone-500" lang="am">
            {process.title.am}
          </p>
        ) : null}
        <p className="mt-2 max-w-3xl text-stone-600">{lt(process.summary)}</p>
        <div className="mt-3">
          <TrustBar
            verificationStatus={process.verificationStatus}
            lastVerifiedAt={process.lastVerifiedAt}
            communityReportCount={noteCount}
          />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-6">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {process.whoNeedsIt ? (
                  <div>
                    <dt className="font-medium text-stone-800">Who needs this</dt>
                    <dd className="mt-0.5 text-stone-600">{lt(process.whoNeedsIt)}</dd>
                  </div>
                ) : null}
                {process.whenNeeded ? (
                  <div>
                    <dt className="font-medium text-stone-800">When you need it</dt>
                    <dd className="mt-0.5 text-stone-600">{lt(process.whenNeeded)}</dd>
                  </div>
                ) : null}
                <div>
                  <dt className="font-medium text-stone-800">Approximate complexity</dt>
                  <dd className="mt-0.5 text-stone-600">{COMPLEXITY_LABELS[process.complexity]}</dd>
                </div>
                <div>
                  <dt className="font-medium text-stone-800">Steps</dt>
                  <dd className="mt-0.5 text-stone-600">
                    {steps.length > 0 ? `${steps.length} documented steps` : "Not yet documented"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Step journey */}
          {steps.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>The journey, step by step</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-0">
                  {steps.map((step, index) => (
                    <li key={step.id} className="relative flex gap-4 pb-8 last:pb-0">
                      {index < steps.length - 1 ? (
                        <span
                          aria-hidden="true"
                          className="absolute top-9 left-[15px] h-full w-0.5 bg-primary-100"
                        />
                      ) : null}
                      <span
                        aria-hidden="true"
                        className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-700 text-sm font-semibold text-white"
                      >
                        {step.stepNumber}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="pt-1 font-semibold text-stone-900">{lt(step.title)}</h3>
                        {step.officialBody && lt(step.officialBody) ? (
                          <div className="mt-2 rounded-md border border-primary-100 bg-primary-50/50 p-3">
                            <LayerBadge layer="official" />
                            <MarkdownView markdown={lt(step.officialBody)} className="mt-1.5" />
                          </div>
                        ) : null}
                        {step.communityBody && lt(step.communityBody) ? (
                          <div className="mt-2 rounded-md border border-accent-100 bg-accent-50/50 p-3">
                            <LayerBadge layer="community" />
                            <MarkdownView markdown={lt(step.communityBody)} className="mt-1.5" />
                          </div>
                        ) : null}
                        {step.office ? (
                          <p className="mt-2 text-sm text-stone-500">
                            <Building2 aria-hidden="true" className="mr-1 inline size-3.5" />
                            Where:{" "}
                            <Link
                              href={`/offices/${step.office.slug}`}
                              className="font-medium text-primary-700 hover:underline"
                            >
                              {lt(step.office.name)}
                            </Link>
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          ) : null}

          {/* Official procedure */}
          {process.officialProcedure && lt(process.officialProcedure) ? (
            <Card>
              <CardHeader className="flex items-center justify-between gap-3">
                <CardTitle>Official procedure</CardTitle>
                <LayerBadge layer="official" />
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-xs text-stone-500">
                  Derived from official sources listed in the Sources section below.
                </p>
                <MarkdownView markdown={lt(process.officialProcedure)} />
              </CardContent>
            </Card>
          ) : null}

          {/* Practical guide */}
          {process.practicalGuide && lt(process.practicalGuide) ? (
            <Card>
              <CardHeader className="flex items-center justify-between gap-3">
                <CardTitle>Practical guide</CardTitle>
                <LayerBadge layer="community" />
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-xs text-stone-500">
                  Community-maintained. Based on real experiences — not official information.
                </p>
                <MarkdownView markdown={lt(process.practicalGuide)} />
              </CardContent>
            </Card>
          ) : null}

          {/* Required documents */}
          {requirements.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Required documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {officialRequirements.length > 0 ? (
                  <div>
                    <p className="mb-2 text-sm text-stone-600">
                      <LayerBadge layer="official" />{" "}
                      <span className="ml-1">
                        According to the official source, these documents are required:
                      </span>
                    </p>
                    <RequirementTable requirements={officialRequirements} />
                  </div>
                ) : null}
                {communityRequirements.length > 0 ? (
                  <div>
                    <p className="mb-2 text-sm text-stone-600">
                      <LayerBadge layer="community" />{" "}
                      <span className="ml-1">
                        Contributors reported also being asked for:
                      </span>
                    </p>
                    <RequirementTable requirements={communityRequirements} />
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {/* Fees */}
          <Card>
            <CardHeader>
              <CardTitle>Fees</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {fees.length === 0 ? (
                <p className="flex items-center gap-2 text-stone-500">
                  <CircleHelp aria-hidden="true" className="size-4" />
                  No fee information is available yet. Fees are only listed when officially
                  published or reported by contributors — never estimated.
                </p>
              ) : (
                <>
                  {officialFees.length > 0 ? (
                    <FeeGroup label="Officially published fees" layer="official" fees={officialFees} />
                  ) : null}
                  {communityFees.length > 0 ? (
                    <FeeGroup label="Community-reported fees" layer="community" fees={communityFees} />
                  ) : null}
                  {unknownFees.length > 0 ? (
                    <div>
                      <p className="mb-1.5 font-medium text-stone-800">Unknown</p>
                      <ul className="space-y-1 text-stone-600">
                        {unknownFees.map((fee) => (
                          <li key={fee.id}>
                            {lt(fee.label)} — <span className="text-stone-400">amount unknown</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>

          {/* Processing time */}
          <Card>
            <CardHeader>
              <CardTitle>Processing time</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {durations.length === 0 ? (
                <p className="flex items-center gap-2 text-stone-500">
                  <CircleHelp aria-hidden="true" className="size-4" />
                  No processing-time information yet.
                </p>
              ) : (
                <>
                  {officialDurations.length > 0 ? (
                    <div>
                      <p className="mb-1.5 flex items-center gap-2 font-medium text-stone-800">
                        <LayerBadge layer="official" /> Officially stated
                      </p>
                      <ul className="space-y-1 text-stone-600">
                        {officialDurations.map((d) => (
                          <li key={d.id}>
                            {lt(d.label)}: <strong className="font-medium">{lt(d.duration)}</strong>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {communityDurations.length > 0 ? (
                    <div>
                      <p className="mb-1.5 flex items-center gap-2 font-medium text-stone-800">
                        <LayerBadge layer="community" /> Community-reported experience
                      </p>
                      <ul className="space-y-1 text-stone-600">
                        {communityDurations.map((d) => (
                          <li key={d.id}>
                            {lt(d.label)}: <strong className="font-medium">{lt(d.duration)}</strong>
                            {d.reportCount > 0 ? (
                              <span className="ml-1 text-xs text-stone-400">
                                ({d.reportCount} report{d.reportCount === 1 ? "" : "s"})
                              </span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>

          {/* Community layer */}
          <CommunitySection
            entityType="process"
            entityId={process.id}
            currentPath={`/processes/${process.slug}`}
          />

          <SourcesList citations={citations} />

          <div className="flex items-center justify-between gap-4">
            <ReportDialog entityType="process" entityId={process.id} isSignedIn={user !== null} />
          </div>

          {canVerify ? (
            <VerifyControls entityType="process" entityId={process.id} canMarkState={canMarkState} />
          ) : null}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {officesInvolved.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Where to go</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {officesInvolved.map((office) => (
                    <li key={office.id}>
                      <Link
                        href={`/offices/${office.slug}`}
                        className="flex items-start gap-2 text-sm text-stone-700 hover:text-primary-800"
                      >
                        <Building2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-stone-400" />
                        <span>{lt(office.name)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>About this process</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-stone-600">
              {category ? (
                <p>
                  Category:{" "}
                  <Link href={`/categories/${category.slug}`} className="text-primary-700 hover:underline">
                    {lt(category.name)}
                  </Link>
                </p>
              ) : null}
              {location ? (
                <p>
                  Location:{" "}
                  <Link href={`/locations/${location.slug}`} className="text-primary-700 hover:underline">
                    {lt(location.name)}
                  </Link>
                </p>
              ) : null}
              <p className="flex items-center gap-2">
                <Badge variant="neutral">{steps.length} steps</Badge>
                <Badge variant="neutral">{COMPLEXITY_LABELS[process.complexity]}</Badge>
              </p>
            </CardContent>
          </Card>

          <RelatedList items={related} />
        </aside>
      </div>
    </div>
  );
}

function RequirementTable({
  requirements,
}: {
  requirements: Array<{
    id: string;
    name: Record<string, string | undefined>;
    required: boolean;
    whereToObtain: Record<string, string | undefined> | null;
    documentId: string | null;
    reportCount: number;
    layer: "official" | "community";
  }>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-md text-left text-sm">
        <thead>
          <tr className="border-b border-stone-200 text-xs text-stone-500 uppercase">
            <th scope="col" className="py-2 pr-4 font-medium">Document</th>
            <th scope="col" className="py-2 pr-4 font-medium">Required</th>
            <th scope="col" className="py-2 font-medium">Where to obtain</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {requirements.map((req) => (
            <tr key={req.id}>
              <td className="py-2 pr-4 font-medium text-stone-800">
                {localize(req.name)}
                {req.layer === "community" && req.reportCount > 0 ? (
                  <span className="ml-1.5 text-xs font-normal text-stone-400">
                    {req.reportCount} report{req.reportCount === 1 ? "" : "s"}
                  </span>
                ) : null}
              </td>
              <td className="py-2 pr-4 text-stone-600">{req.required ? "Required" : "Optional"}</td>
              <td className="py-2 text-stone-600">
                {req.whereToObtain ? localize(req.whereToObtain) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FeeGroup({
  label,
  layer,
  fees,
}: {
  label: string;
  layer: "official" | "community";
  fees: Array<{
    id: string;
    label: Record<string, string | undefined>;
    amountMin: string | null;
    amountMax: string | null;
    currency: string;
    reportCount: number;
    note: Record<string, string | undefined> | null;
  }>;
}) {
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-2 font-medium text-stone-800">
        <LayerBadge layer={layer} /> {label}
      </p>
      <ul className="space-y-1 text-stone-600">
        {fees.map((fee) => (
          <li key={fee.id}>
            {localize(fee.label)}:{" "}
            <strong className="font-medium">
              {formatEtb(fee.amountMin, fee.amountMax, fee.currency)}
            </strong>
            {layer === "community" && fee.reportCount > 0 ? (
              <span className="ml-1 text-xs text-stone-400">
                ({fee.reportCount} report{fee.reportCount === 1 ? "" : "s"})
              </span>
            ) : null}
            {fee.note ? <span className="ml-1 text-xs text-stone-400">{localize(fee.note)}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
