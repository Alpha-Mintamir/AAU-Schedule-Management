import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { RevertForm } from "@/components/moderation/revert-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { hasPermission } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import { compactDiff, diffLines, snapshotToText } from "@/lib/diff";
import { lt } from "@/lib/i18n";
import { getPageForEdit, listPageRevisions, type PageSnapshot } from "@/lib/services/pages";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Revision history" };

const STATUS_VARIANT: Record<string, "success" | "danger" | "neutral"> = {
  approved: "success",
  rejected: "danger",
  pending: "neutral",
};

export default async function PageHistoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = await getPageForEdit(slug);
  if (!detail || detail.page.status !== "published") notFound();

  const [revisionRows, user] = await Promise.all([
    listPageRevisions(detail.page.id),
    getCurrentUser(),
  ]);
  const canRevert = hasPermission(user?.role, "moderation:revert_revisions");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: "Guides", href: "/pages" },
          { label: lt(detail.page.title), href: `/pages/${slug}` },
          { label: "History" },
        ]}
      />
      <h1 className="mb-1 text-2xl font-bold text-stone-900">Revision history</h1>
      <p className="mb-6 text-stone-600">
        Every change to “{lt(detail.page.title)}”, including who made it and why. Approved
        revisions are live; pending ones await review.
      </p>

      {revisionRows.length === 0 ? (
        <p className="rounded-md border border-dashed border-stone-300 bg-white px-4 py-8 text-center text-sm text-stone-500">
          No revisions recorded yet.
        </p>
      ) : (
        <ol className="space-y-4">
          {revisionRows.map(({ revision, authorName }) => {
            const before = revision.previousSnapshot
              ? snapshotToText(revision.previousSnapshot as unknown as PageSnapshot)
              : "";
            const after = snapshotToText(revision.snapshot as unknown as PageSnapshot);
            const diff = compactDiff(diffLines(before, after));
            return (
              <li key={revision.id}>
                <Card>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                      <span className="font-semibold text-stone-900">
                        Revision #{revision.revisionNumber}
                      </span>
                      <Badge variant={STATUS_VARIANT[revision.status] ?? "neutral"}>
                        {revision.status}
                      </Badge>
                      <span className="text-stone-500">
                        {authorName ?? "Unknown"} · {formatDate(revision.createdAt)}
                      </span>
                      {revision.revisionNumber === detail.page.currentRevisionNumber ? (
                        <Badge variant="info">current</Badge>
                      ) : null}
                    </div>
                    <p className="text-sm text-stone-700">
                      <span className="font-medium">Reason:</span> {revision.changeReason}
                    </p>
                    {revision.reviewNote ? (
                      <p className="text-sm text-stone-500">
                        <span className="font-medium">Review note:</span> {revision.reviewNote}
                      </p>
                    ) : null}

                    <details>
                      <summary className="cursor-pointer text-sm font-medium text-primary-700 hover:underline">
                        Show changes
                      </summary>
                      <pre className="mt-2 max-h-96 overflow-auto rounded-md bg-stone-950 p-3 text-xs leading-relaxed whitespace-pre-wrap">
                        {diff.map((op, index) =>
                          op.type === "skip" ? (
                            <span key={index} className="block text-stone-500">
                              … {op.count} unchanged line{op.count === 1 ? "" : "s"} …
                            </span>
                          ) : (
                            <span
                              key={index}
                              className={
                                op.type === "added"
                                  ? "block bg-primary-900/60 text-primary-200"
                                  : op.type === "removed"
                                    ? "block bg-red-900/50 text-red-200"
                                    : "block text-stone-300"
                              }
                            >
                              {op.type === "added" ? "+ " : op.type === "removed" ? "- " : "  "}
                              {op.line}
                            </span>
                          ),
                        )}
                      </pre>
                    </details>

                    {canRevert &&
                    revision.status === "approved" &&
                    revision.revisionNumber !== detail.page.currentRevisionNumber ? (
                      <RevertForm revisionId={revision.id} />
                    ) : null}
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
