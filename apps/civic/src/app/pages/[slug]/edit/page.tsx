import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { PageEditor } from "@/components/contribute/page-editor";
import { Alert } from "@/components/ui/alert";
import { getCurrentUser } from "@/lib/auth/session";
import { lt } from "@/lib/i18n";
import { getPageForEdit } from "@/lib/services/pages";

export const metadata: Metadata = { title: "Suggest an edit" };

export default async function EditPagePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const detail = await getPageForEdit(slug);
  if (!detail || detail.page.status !== "published") notFound();
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: "Guides", href: "/pages" },
          { label: lt(detail.page.title), href: `/pages/${slug}` },
          { label: "Suggest edit" },
        ]}
      />
      <h1 className="mb-1 text-2xl font-bold text-stone-900">
        Suggest an edit: {lt(detail.page.title)}
      </h1>
      <p className="mb-6 max-w-2xl text-stone-600">
        Your changes will not go live immediately. They are submitted as a revision and reviewed
        by the community before publishing. The full revision history is preserved.
      </p>

      {!user ? (
        <Alert variant="info">
          <Link
            href={`/login?next=${encodeURIComponent(`/pages/${slug}/edit`)}`}
            className="font-medium underline"
          >
            Sign in
          </Link>{" "}
          or{" "}
          <Link href="/register" className="font-medium underline">
            create an account
          </Link>{" "}
          to suggest edits.
        </Alert>
      ) : (
        <PageEditor
          pageSlug={detail.page.slug}
          initial={{
            titleEn: detail.page.title.en ?? "",
            titleAm: detail.page.title.am ?? "",
            summaryEn: detail.page.summary.en ?? "",
            summaryAm: detail.page.summary.am ?? "",
            sections: detail.sections.map((section) => ({
              headingEn: section.heading.en ?? "",
              headingAm: section.heading.am ?? "",
              bodyEn: section.body.en ?? "",
              bodyAm: section.body.am ?? "",
              layer: section.layer,
            })),
          }}
        />
      )}
    </div>
  );
}
