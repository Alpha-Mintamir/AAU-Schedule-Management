import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { History, PencilLine } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CommunitySection } from "@/components/community/community-section";
import { ReportDialog } from "@/components/community/report-dialog";
import { VerifyControls } from "@/components/community/verify-controls";
import { JsonLd } from "@/components/json-ld";
import { MarkdownView } from "@/components/markdown-view";
import { RelatedList } from "@/components/related-list";
import { SourcesList } from "@/components/sources-list";
import { TrustBar } from "@/components/trust-bar";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayerBadge } from "@/components/verification-badge";
import { hasPermission } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import { lt } from "@/lib/i18n";
import { countPublishedNotes } from "@/lib/services/notes";
import { getPageBySlug, listPageContributors } from "@/lib/services/pages";
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
  const detail = await getPageBySlug(slug);
  if (!detail) return { title: "Guide not found" };
  return {
    title: lt(detail.page.title),
    description: truncate(lt(detail.page.summary), 160),
    alternates: { canonical: `/pages/${detail.page.slug}` },
  };
}

export default async function KnowledgePageDetail({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ submitted?: string }>;
}) {
  const [{ slug }, { submitted }] = await Promise.all([params, searchParams]);
  const detail = await getPageBySlug(slug);
  if (!detail) notFound();

  const { page, sections, category, location } = detail;
  const [citations, related, noteCount, contributors, user] = await Promise.all([
    listCitationsForEntity("knowledge_page", page.id),
    listRelated("knowledge_page", page.id),
    countPublishedNotes("knowledge_page", page.id),
    listPageContributors(page.id),
    getCurrentUser(),
  ]);

  const canVerify = hasPermission(user?.role, "moderation:verify_content");
  const canMarkState = hasPermission(user?.role, "moderation:mark_outdated");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: lt(page.title),
    description: lt(page.summary),
    dateModified: page.updatedAt.toISOString(),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <JsonLd data={jsonLd} />
      <Breadcrumbs items={[{ label: "Guides", href: "/pages" }, { label: lt(page.title) }]} />

      {submitted === "edit" ? (
        <Alert variant="success" className="mb-4">
          Your suggested edit was submitted and is waiting for review. It will appear here once a
          reviewer approves it.
        </Alert>
      ) : null}

      <header className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 sm:text-3xl">{lt(page.title)}</h1>
            {page.title.am ? (
              <p className="mt-0.5 text-lg text-stone-500" lang="am">
                {page.title.am}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 gap-2">
            <Link
              href={`/pages/${page.slug}/edit`}
              className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-100"
            >
              <PencilLine aria-hidden="true" className="size-3.5" /> Suggest edit
            </Link>
            <Link
              href={`/pages/${page.slug}/history`}
              className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-100"
            >
              <History aria-hidden="true" className="size-3.5" /> History
            </Link>
          </div>
        </div>
        <p className="mt-2 max-w-3xl text-stone-600">{lt(page.summary)}</p>
        <div className="mt-3">
          <TrustBar
            verificationStatus={page.verificationStatus}
            lastVerifiedAt={page.lastVerifiedAt}
            communityReportCount={noteCount}
          />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-6">
          {sections.map((section) => (
            <Card key={section.id}>
              <CardHeader className="flex items-center justify-between gap-3">
                <CardTitle>{lt(section.heading)}</CardTitle>
                <LayerBadge layer={section.layer} />
              </CardHeader>
              <CardContent>
                {section.layer === "official" ? (
                  <p className="mb-3 text-xs text-stone-500">
                    Based on official sources — see the Sources section for citations.
                  </p>
                ) : null}
                <MarkdownView markdown={lt(section.body)} />
              </CardContent>
            </Card>
          ))}

          <CommunitySection
            entityType="knowledge_page"
            entityId={page.id}
            currentPath={`/pages/${page.slug}`}
          />

          <SourcesList citations={citations} />

          <ReportDialog entityType="knowledge_page" entityId={page.id} isSignedIn={user !== null} />

          {canVerify ? (
            <VerifyControls
              entityType="knowledge_page"
              entityId={page.id}
              canMarkState={canMarkState}
            />
          ) : null}
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>About this guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-stone-600">
              {category ? (
                <p>
                  Category:{" "}
                  <Link
                    href={`/categories/${category.slug}`}
                    className="text-primary-700 hover:underline"
                  >
                    {lt(category.name)}
                  </Link>
                </p>
              ) : null}
              {location ? (
                <p>
                  Location:{" "}
                  <Link
                    href={`/locations/${location.slug}`}
                    className="text-primary-700 hover:underline"
                  >
                    {lt(location.name)}
                  </Link>
                </p>
              ) : null}
              <p>Revision #{page.currentRevisionNumber}</p>
              {contributors.length > 0 ? (
                <div>
                  <p className="font-medium text-stone-800">Contributors</p>
                  <ul className="mt-1 space-y-0.5">
                    {contributors.map((contributor) => (
                      <li key={contributor.id}>{contributor.name}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </CardContent>
          </Card>
          <RelatedList items={related} />
        </aside>
      </div>
    </div>
  );
}
