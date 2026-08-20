import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, ExternalLink, FileText } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CommunitySection } from "@/components/community/community-section";
import { ReportDialog } from "@/components/community/report-dialog";
import { VerifyControls } from "@/components/community/verify-controls";
import { RelatedList } from "@/components/related-list";
import { TrustBar } from "@/components/trust-bar";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasPermission } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import { lt } from "@/lib/i18n";
import { getDocumentBySlug } from "@/lib/services/documents";
import { countPublishedNotes } from "@/lib/services/notes";
import { listRelated } from "@/lib/services/related";
import { formatDate, formatFileSize, truncate } from "@/lib/utils";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getDocumentBySlug(slug);
  if (!detail) return { title: "Document not found" };
  return {
    title: lt(detail.document.title),
    description: truncate(lt(detail.document.description ?? {}) || lt(detail.document.title), 160),
    alternates: { canonical: `/documents/${detail.document.slug}` },
  };
}

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = await getDocumentBySlug(slug);
  if (!detail) notFound();

  const { document, category, organization, source, contributorName, versions, currentVersion } =
    detail;
  const [related, noteCount, user] = await Promise.all([
    listRelated("document", document.id),
    countPublishedNotes("document", document.id),
    getCurrentUser(),
  ]);

  const canVerify = hasPermission(user?.role, "moderation:verify_content");
  const canMarkState = hasPermission(user?.role, "moderation:mark_outdated");
  const isOfficial = document.layer === "official";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs
        items={[{ label: "Documents", href: "/documents" }, { label: lt(document.title) }]}
      />

      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-stone-900 sm:text-3xl">{lt(document.title)}</h1>
          <Badge variant={isOfficial ? "official" : "community"} className="text-xs">
            {isOfficial ? "Official" : "Community template"}
          </Badge>
        </div>
        {document.title.am ? (
          <p className="mt-0.5 text-lg text-stone-500" lang="am">
            {document.title.am}
          </p>
        ) : null}
        <div className="mt-3">
          <TrustBar
            verificationStatus={document.verificationStatus}
            lastVerifiedAt={document.lastVerifiedAt}
            communityReportCount={noteCount}
          />
        </div>
      </header>

      {!isOfficial ? (
        <Alert variant="warning" className="mb-6">
          This is a <strong>community-created template</strong>, not an official government
          document. Review it carefully and adapt it to your situation before use.
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About this document</CardTitle>
            </CardHeader>
            <CardContent>
              {document.description ? (
                <p className="text-sm leading-relaxed text-stone-700">
                  {lt(document.description)}
                </p>
              ) : null}
              <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-medium text-stone-800">Type</dt>
                  <dd className="mt-0.5 text-stone-600 capitalize">{document.docType}</dd>
                </div>
                <div>
                  <dt className="font-medium text-stone-800">Language</dt>
                  <dd className="mt-0.5 text-stone-600 uppercase">{document.language}</dd>
                </div>
                {organization ? (
                  <div>
                    <dt className="font-medium text-stone-800">Issuing organization</dt>
                    <dd className="mt-0.5 text-stone-600">{lt(organization.name)}</dd>
                  </div>
                ) : null}
                {document.version ? (
                  <div>
                    <dt className="font-medium text-stone-800">Version</dt>
                    <dd className="mt-0.5 text-stone-600">{document.version}</dd>
                  </div>
                ) : null}
                {document.publishedDate ? (
                  <div>
                    <dt className="font-medium text-stone-800">Published</dt>
                    <dd className="mt-0.5 text-stone-600">{formatDate(document.publishedDate)}</dd>
                  </div>
                ) : null}
                {document.license ? (
                  <div>
                    <dt className="font-medium text-stone-800">License / usage</dt>
                    <dd className="mt-0.5 text-stone-600">{document.license}</dd>
                  </div>
                ) : null}
                {contributorName && !isOfficial ? (
                  <div>
                    <dt className="font-medium text-stone-800">Contributed by</dt>
                    <dd className="mt-0.5 text-stone-600">{contributorName}</dd>
                  </div>
                ) : null}
                {source ? (
                  <div className="sm:col-span-2">
                    <dt className="font-medium text-stone-800">Source</dt>
                    <dd className="mt-0.5 text-stone-600">
                      {source.url ? (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="text-primary-700 hover:underline"
                        >
                          {source.title}
                          <ExternalLink aria-hidden="true" className="ml-1 inline size-3" />
                        </a>
                      ) : (
                        source.title
                      )}
                      {source.organization ? ` · ${source.organization}` : ""}
                      {source.retrievedAt ? ` · Retrieved ${formatDate(source.retrievedAt)}` : ""}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </CardContent>
          </Card>

          {currentVersion ? (
            <Card>
              <CardHeader>
                <CardTitle>Download</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-4">
                  <a
                    href={`/api/documents/${document.slug}/download`}
                    className="inline-flex h-11 items-center gap-2 rounded-md bg-primary-700 px-5 text-sm font-medium text-white hover:bg-primary-800"
                  >
                    <Download aria-hidden="true" className="size-4" />
                    Download {currentVersion.format.toUpperCase()}
                  </a>
                  <p className="text-sm text-stone-500">
                    {formatFileSize(currentVersion.fileSize)} ·{" "}
                    {currentVersion.format.toUpperCase()} · SHA-256{" "}
                    <code className="rounded bg-stone-100 px-1 text-xs">
                      {currentVersion.sha256.slice(0, 12)}…
                    </code>
                  </p>
                </div>
                {versions.length > 1 ? (
                  <div className="mt-4 border-t border-stone-100 pt-3">
                    <h3 className="mb-2 text-sm font-semibold text-stone-800">Version history</h3>
                    <ul className="space-y-1 text-sm text-stone-600">
                      {versions.map((version) => (
                        <li key={version.id} className="flex items-center gap-2">
                          <FileText aria-hidden="true" className="size-3.5 text-stone-400" />
                          v{version.versionNumber} · {formatDate(version.createdAt)} ·{" "}
                          {formatFileSize(version.fileSize)}
                          {version.changeNote ? ` — ${version.changeNote}` : ""}
                          {version.id === currentVersion.id ? (
                            <Badge variant="success">current</Badge>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : (
            <Alert variant="info">No downloadable file is attached to this document yet.</Alert>
          )}

          <CommunitySection
            entityType="document"
            entityId={document.id}
            currentPath={`/documents/${document.slug}`}
          />

          <ReportDialog entityType="document" entityId={document.id} isSignedIn={user !== null} />

          {canVerify ? (
            <VerifyControls
              entityType="document"
              entityId={document.id}
              canMarkState={canMarkState}
            />
          ) : null}
        </div>

        <aside className="space-y-4">
          {category ? (
            <Card>
              <CardHeader>
                <CardTitle>Category</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/categories/${category.slug}`}
                  className="text-sm text-primary-700 hover:underline"
                >
                  {lt(category.name)}
                </Link>
              </CardContent>
            </Card>
          ) : null}
          <RelatedList items={related} />
        </aside>
      </div>
    </div>
  );
}
