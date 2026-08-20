import Link from "next/link";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import type { entityTypeEnum } from "@/lib/db/schema";
import { listPublishedNotes } from "@/lib/services/notes";
import { formatMonthYear, timeAgo } from "@/lib/utils";
import { ConfirmButton } from "./confirm-button";
import { ExperienceForm } from "./experience-form";

type EntityType = (typeof entityTypeEnum.enumValues)[number];

const KIND_LABELS: Record<string, string> = {
  experience: "Experience",
  tip: "Tip",
  problem: "Problem",
  fee_report: "Fee report",
  time_report: "Processing time",
  document_report: "Documents requested",
  office_update: "Office update",
  correction: "Correction",
};

/**
 * The community knowledge layer for any entity: published experiences, tips
 * and reports — always visually separated from official information — plus
 * the submission form for signed-in contributors.
 */
export async function CommunitySection({
  entityType,
  entityId,
  currentPath,
}: {
  entityType: EntityType;
  entityId: string;
  currentPath: string;
}) {
  const [notes, user] = await Promise.all([
    listPublishedNotes(entityType, entityId),
    getCurrentUser(),
  ]);

  return (
    <Card id="community">
      <CardHeader className="flex items-center justify-between gap-3">
        <CardTitle className="flex items-center gap-2">
          <Users aria-hidden="true" className="size-4 text-accent-600" />
          Community experience
        </CardTitle>
        <Badge variant="community">Community</Badge>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-stone-500">
          Reports from people who actually went through this. Community reports are moderated
          but are <strong className="font-semibold">not official information</strong>.
        </p>

        {notes.length === 0 ? (
          <p className="rounded-md border border-dashed border-stone-300 px-4 py-6 text-center text-sm text-stone-500">
            No community reports yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {notes.map((note) => (
              <li key={note.id} className="rounded-lg border border-stone-200 bg-stone-50/60 p-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                  <Badge variant="neutral">{KIND_LABELS[note.kind] ?? note.kind}</Badge>
                  {note.confirmCount > 0 ? (
                    <span className="font-medium text-primary-700">
                      {note.confirmCount + 1} contributors reported this
                    </span>
                  ) : null}
                  {note.experiencedAt ? (
                    <span>Experienced {formatMonthYear(note.experiencedAt)}</span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-stone-700">
                  {note.body}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-stone-400">
                  <span>
                    {note.authorName} · {timeAgo(note.createdAt)}
                  </span>
                  {user && user.id !== note.authorId ? <ConfirmButton noteId={note.id} /> : null}
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 border-t border-stone-100 pt-5">
          <h3 className="mb-3 text-sm font-semibold text-stone-800">Share your experience</h3>
          {user ? (
            <ExperienceForm entityType={entityType} entityId={entityId} />
          ) : (
            <p className="text-sm text-stone-500">
              <Link
                href={`/login?next=${encodeURIComponent(currentPath)}`}
                className="font-medium text-primary-700 hover:underline"
              >
                Sign in
              </Link>{" "}
              or{" "}
              <Link
                href="/register"
                className="font-medium text-primary-700 hover:underline"
              >
                create an account
              </Link>{" "}
              to share what you experienced. Every report helps others navigate the process.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
