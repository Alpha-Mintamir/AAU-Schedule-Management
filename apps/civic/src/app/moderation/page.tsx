import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { inArray } from "drizzle-orm";
import { Breadcrumbs } from "@/components/breadcrumbs";
import {
  ContributionDecisionForms,
  FlagResolutionForm,
} from "@/components/moderation/decision-forms";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { canModerate, hasPermission } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { revisions } from "@/lib/db/schema";
import { compactDiff, diffLines, snapshotToText } from "@/lib/diff";
import { listOpenFlags, listPendingContributions } from "@/lib/services/moderation";
import type { PageSnapshot } from "@/lib/services/pages";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Moderation queue" };

const TYPE_LABELS: Record<string, string> = {
  edit_page: "Page edit",
  create_page: "New guide",
  submit_official_info: "Official info submission",
  submit_document: "Document submission",
  report_outdated: "Outdated report",
  add_office: "New office",
  add_experience: "Community report",
  add_source: "Source",
  correction: "Correction",
  office_report: "Office report",
};

const FLAG_LABELS: Record<string, string> = {
  incorrect_information: "Incorrect information",
  outdated_information: "Outdated information",
  fake_document: "Fake document",
  wrong_office_location: "Wrong office location",
  wrong_fees: "Wrong fees",
  broken_link: "Broken link",
  misleading_information: "Misleading information",
  duplicate_page: "Duplicate page",
  copyright_issue: "Copyright issue",
  spam_or_abuse: "Spam or abuse",
  other: "Other",
};

export default async function ModerationPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/moderation");
  if (!canModerate(user.role)) redirect("/");

  const [pending, flags] = await Promise.all([listPendingContributions(), listOpenFlags()]);
  const canResolveFlags = hasPermission(user.role, "moderation:resolve_flags");

  const revisionIds = pending
    .map(({ contribution }) => contribution.revisionId)
    .filter((id): id is string => id !== null);
  const revisionRows =
    revisionIds.length > 0
      ? await db.select().from(revisions).where(inArray(revisions.id, revisionIds))
      : [];
  const revisionById = new Map(revisionRows.map((revision) => [revision.id, revision]));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Moderation" }]} />
      <h1 className="text-2xl font-bold text-stone-900">Moderation queue</h1>
      <p className="mt-1 mb-8 text-stone-600">
        Contributions flow Submit → Validation → Moderation → Review → Publish. Nothing is
        published without a decision recorded here.
      </p>

      <section className="mb-10" aria-labelledby="pending-heading">
        <h2 id="pending-heading" className="mb-3 text-lg font-semibold text-stone-900">
          Pending contributions <Badge variant="neutral">{pending.length}</Badge>
        </h2>
        {pending.length === 0 ? (
          <p className="rounded-md border border-dashed border-stone-300 bg-white px-4 py-8 text-center text-sm text-stone-500">
            The queue is empty. Well done.
          </p>
        ) : (
          <ol className="space-y-4">
            {pending.map(({ contribution, authorName, authorRole }) => {
              const revision = contribution.revisionId
                ? revisionById.get(contribution.revisionId)
                : undefined;
              const diff = revision
                ? compactDiff(
                    diffLines(
                      revision.previousSnapshot
                        ? snapshotToText(revision.previousSnapshot as unknown as PageSnapshot)
                        : "",
                      snapshotToText(revision.snapshot as unknown as PageSnapshot),
                    ),
                  )
                : null;
              const payload = contribution.payload;
              return (
                <li key={contribution.id}>
                  <Card>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                        <Badge variant="info">
                          {TYPE_LABELS[contribution.type] ?? contribution.type}
                        </Badge>
                        <span className="font-medium text-stone-800">{authorName}</span>
                        <span className="text-xs text-stone-400">
                          {authorRole.replace("_", " ")} · {formatDate(contribution.createdAt)}
                        </span>
                      </div>

                      {typeof payload.title === "string" ? (
                        <p className="text-sm text-stone-700">
                          <span className="font-medium">Title:</span> {payload.title}
                        </p>
                      ) : null}
                      {typeof payload.pageSlug === "string" ? (
                        <p className="text-sm text-stone-700">
                          <span className="font-medium">Page:</span>{" "}
                          <Link
                            href={`/pages/${payload.pageSlug}`}
                            className="text-primary-700 hover:underline"
                          >
                            /pages/{payload.pageSlug}
                          </Link>
                        </p>
                      ) : null}
                      {typeof payload.changeReason === "string" ? (
                        <p className="text-sm text-stone-700">
                          <span className="font-medium">Reason:</span> {payload.changeReason}
                        </p>
                      ) : null}
                      {contribution.type === "submit_document" && typeof payload.slug === "string" ? (
                        <p className="text-sm text-stone-700">
                          <span className="font-medium">File:</span>{" "}
                          <a
                            href={`/api/documents/${payload.slug}/download`}
                            className="text-primary-700 hover:underline"
                          >
                            download for review
                          </a>
                          {typeof payload.layer === "string" ? (
                            <span className="ml-2 text-xs text-stone-500">
                              claimed origin: {payload.layer}
                            </span>
                          ) : null}
                          {typeof payload.sourceUrl === "string" && payload.sourceUrl ? (
                            <span className="ml-2 text-xs text-stone-500">
                              source: {payload.sourceUrl}
                            </span>
                          ) : null}
                        </p>
                      ) : null}
                      {contribution.type === "add_experience" && typeof payload.body === "string" ? (
                        <blockquote className="rounded-md bg-stone-50 p-3 text-sm whitespace-pre-line text-stone-700">
                          {payload.body}
                        </blockquote>
                      ) : null}

                      {diff ? (
                        <details>
                          <summary className="cursor-pointer text-sm font-medium text-primary-700 hover:underline">
                            Review changes
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
                      ) : null}

                      <ContributionDecisionForms contributionId={contribution.id} />
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section aria-labelledby="flags-heading">
        <h2 id="flags-heading" className="mb-3 text-lg font-semibold text-stone-900">
          Open problem reports <Badge variant="neutral">{flags.length}</Badge>
        </h2>
        {flags.length === 0 ? (
          <p className="rounded-md border border-dashed border-stone-300 bg-white px-4 py-8 text-center text-sm text-stone-500">
            No open reports.
          </p>
        ) : (
          <ol className="space-y-4">
            {flags.map(({ flag, reporterName }) => (
              <li key={flag.id}>
                <Card>
                  <CardHeader className="flex flex-wrap items-center gap-3">
                    <CardTitle className="text-sm">
                      {FLAG_LABELS[flag.reason] ?? flag.reason}
                    </CardTitle>
                    <Badge variant="danger">{flag.entityType.replace("_", " ")}</Badge>
                    <span className="ml-auto text-xs text-stone-400">
                      {reporterName ?? "Anonymous"} · {formatDate(flag.createdAt)}
                    </span>
                  </CardHeader>
                  <CardContent>
                    {flag.details ? (
                      <p className="mb-3 text-sm whitespace-pre-line text-stone-700">{flag.details}</p>
                    ) : (
                      <p className="mb-3 text-sm text-stone-400">No details provided.</p>
                    )}
                    {canResolveFlags ? (
                      <FlagResolutionForm flagId={flag.id} />
                    ) : (
                      <p className="text-xs text-stone-400">
                        Only moderators can resolve reports.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
