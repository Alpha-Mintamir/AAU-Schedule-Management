import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import { listUserContributions } from "@/lib/services/contributions";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "My contributions" };

const STATUS_VARIANT: Record<string, "neutral" | "success" | "danger" | "info"> = {
  pending: "neutral",
  in_review: "info",
  approved: "success",
  rejected: "danger",
  needs_clarification: "info",
};

const TYPE_LABELS: Record<string, string> = {
  edit_page: "Page edit",
  create_page: "New guide",
  submit_official_info: "Official info",
  submit_document: "Document",
  report_outdated: "Outdated report",
  add_office: "New office",
  add_experience: "Experience report",
  add_source: "Source",
  correction: "Correction",
  office_report: "Office report",
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");
  const { submitted } = await searchParams;

  const contributions = await listUserContributions(user.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumbs items={[{ label: "My contributions" }]} />

      {submitted ? (
        <Alert variant="success" className="mb-4">
          {submitted === "page"
            ? "Your guide was submitted and is waiting for review."
            : submitted === "document"
              ? "Your document was submitted and will appear in the archive after review."
              : "Your contribution was submitted for review."}
        </Alert>
      ) : null}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">{user.name}</h1>
          <p className="mt-0.5 text-sm text-stone-500">
            {ROLE_LABELS[user.role]} · Reputation {user.reputation}
          </p>
        </div>
        <Link
          href="/contribute"
          className="rounded-md bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800"
        >
          Contribute
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your contributions</CardTitle>
        </CardHeader>
        <CardContent>
          {contributions.length === 0 ? (
            <p className="py-6 text-center text-sm text-stone-500">
              You haven&apos;t contributed yet.{" "}
              <Link href="/contribute" className="font-medium text-primary-700 hover:underline">
                Start here
              </Link>
              .
            </p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {contributions.map((contribution) => (
                <li key={contribution.id} className="flex flex-wrap items-center gap-3 py-3">
                  <Badge variant="neutral">{TYPE_LABELS[contribution.type] ?? contribution.type}</Badge>
                  <span className="min-w-0 flex-1 truncate text-sm text-stone-700">
                    {typeof contribution.payload.title === "string"
                      ? contribution.payload.title
                      : typeof contribution.payload.pageSlug === "string"
                        ? contribution.payload.pageSlug
                        : typeof contribution.payload.kind === "string"
                          ? `${contribution.payload.kind} report`
                          : "Contribution"}
                  </span>
                  <span className="text-xs text-stone-400">{formatDate(contribution.createdAt)}</span>
                  <Badge variant={STATUS_VARIANT[contribution.status] ?? "neutral"}>
                    {contribution.status.replace("_", " ")}
                  </Badge>
                  {contribution.reviewNote ? (
                    <p className="w-full text-xs text-stone-500">
                      Reviewer: {contribution.reviewNote}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
