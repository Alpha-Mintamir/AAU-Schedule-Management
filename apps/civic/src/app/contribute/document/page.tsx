import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { DocumentForm } from "@/components/contribute/document-form";
import { Alert } from "@/components/ui/alert";
import { getCurrentUser } from "@/lib/auth/session";
import { lt } from "@/lib/i18n";
import { listCategories } from "@/lib/services/taxonomy";

export const metadata: Metadata = { title: "Submit a document" };

export default async function SubmitDocumentPage() {
  const [user, categories] = await Promise.all([getCurrentUser(), listCategories()]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs
        items={[{ label: "Contribute", href: "/contribute" }, { label: "Submit a document" }]}
      />
      <h1 className="text-2xl font-bold text-stone-900">Submit a document</h1>
      <p className="mt-1 mb-6 max-w-2xl text-stone-600">
        Share a government form you obtained or a template you created. Files are checked and
        reviewed by moderators before they become downloadable. Never upload documents containing
        someone else&apos;s personal information.
      </p>
      {!user ? (
        <Alert variant="info">
          <Link href="/login?next=/contribute/document" className="font-medium underline">
            Sign in
          </Link>{" "}
          or{" "}
          <Link href="/register" className="font-medium underline">
            create an account
          </Link>{" "}
          to submit documents.
        </Alert>
      ) : (
        <DocumentForm
          categories={categories.map((category) => ({
            id: category.id,
            label: lt(category.name),
          }))}
        />
      )}
    </div>
  );
}
