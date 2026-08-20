import type { Metadata } from "next";
import Link from "next/link";
import { FilePlus2, FileUp, Flag, MessageSquarePlus, PencilLine, ShieldCheck } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Contribute",
  description: "Help document how Ethiopian public services actually work.",
};

const WAYS = [
  {
    icon: PencilLine,
    title: "Improve an existing guide",
    description:
      "Found something outdated or incomplete? Open any guide and choose “Suggest edit”. Your change goes through review before publishing.",
    href: "/pages",
    cta: "Browse guides",
  },
  {
    icon: FilePlus2,
    title: "Write a new guide",
    description:
      "Document a process or topic that is missing. Clearly separate what official sources say from what you experienced.",
    href: "/contribute/new-page",
    cta: "Start a guide",
  },
  {
    icon: MessageSquarePlus,
    title: "Share your experience",
    description:
      "Completed a process recently? Add what documents you were asked for, what it cost, and how long it took — on any process, office or guide page.",
    href: "/processes",
    cta: "Find the process",
  },
  {
    icon: FileUp,
    title: "Share a document or template",
    description:
      "Upload a government form you obtained or a template you created. Official files and community templates are always labeled separately.",
    href: "/contribute/document",
    cta: "Submit a document",
  },
  {
    icon: Flag,
    title: "Report a problem",
    description:
      "Wrong fees, moved offices, broken links, outdated requirements — every report goes to the moderation queue.",
    href: "/search",
    cta: "Find the page",
  },
] as const;

export default async function ContributePage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Contribute" }]} />
      <h1 className="text-2xl font-bold text-stone-900">Contribute</h1>
      <p className="mt-1 mb-8 max-w-2xl text-stone-600">
        Menged is built by people documenting how things actually work. Every contribution is
        reviewed before it is published, and official information is never mixed with community
        experience.
      </p>

      {!user ? (
        <div className="mb-8 rounded-lg border border-primary-200 bg-primary-50 px-5 py-4 text-sm text-primary-900">
          You need an account to contribute.{" "}
          <Link href="/register" className="font-semibold underline">
            Create one
          </Link>{" "}
          or{" "}
          <Link href="/login?next=/contribute" className="font-semibold underline">
            sign in
          </Link>
          . Browsing and searching never require an account.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {WAYS.map((way) => (
          <div key={way.title} className="flex flex-col rounded-lg border border-stone-200 bg-white p-5">
            <way.icon aria-hidden="true" className="size-6 text-primary-700" />
            <h2 className="mt-3 font-semibold text-stone-900">{way.title}</h2>
            <p className="mt-1 flex-1 text-sm text-stone-600">{way.description}</p>
            <Link
              href={way.href}
              className="mt-3 text-sm font-medium text-primary-700 hover:underline"
            >
              {way.cta} →
            </Link>
          </div>
        ))}
        <div className="flex flex-col rounded-lg border border-stone-200 bg-stone-50 p-5">
          <ShieldCheck aria-hidden="true" className="size-6 text-stone-500" />
          <h2 className="mt-3 font-semibold text-stone-900">How review works</h2>
          <p className="mt-1 flex-1 text-sm text-stone-600">
            Submit → validation → moderation → review → publish. Nothing silently overwrites
            existing information; the full revision history of every page is preserved, and
            trusted contributors&apos; confirmations power the “Community Verified” status.
          </p>
        </div>
      </div>
    </div>
  );
}
