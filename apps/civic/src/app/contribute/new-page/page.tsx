import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { NewPageForm } from "@/components/contribute/new-page-form";
import { Alert } from "@/components/ui/alert";
import { getCurrentUser } from "@/lib/auth/session";
import { lt } from "@/lib/i18n";
import { listCategories } from "@/lib/services/taxonomy";

export const metadata: Metadata = { title: "Suggest a new guide" };

export default async function NewPagePage() {
  const [user, categories] = await Promise.all([getCurrentUser(), listCategories()]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Contribute", href: "/contribute" }, { label: "New guide" }]} />
      <h1 className="text-2xl font-bold text-stone-900">Suggest a new guide</h1>
      <p className="mt-1 mb-6 max-w-2xl text-stone-600">
        Describe a civic topic or process that is missing. Your draft will be reviewed before it
        appears publicly. Write what you know from experience — and never present unverified
        information as official.
      </p>
      {!user ? (
        <Alert variant="info">
          <Link href="/login?next=/contribute/new-page" className="font-medium underline">
            Sign in
          </Link>{" "}
          or{" "}
          <Link href="/register" className="font-medium underline">
            create an account
          </Link>{" "}
          to suggest a guide.
        </Alert>
      ) : (
        <NewPageForm
          categories={categories.map((category) => ({
            id: category.id,
            label: lt(category.name),
          }))}
        />
      )}
    </div>
  );
}
