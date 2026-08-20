import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/account");
  const { next } = await searchParams;

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="text-2xl font-bold text-stone-900">Sign in</h1>
      <p className="mt-1 mb-6 text-sm text-stone-600">
        Sign in to contribute experiences, suggest edits and share documents.
      </p>
      <LoginForm next={next} />
      <p className="mt-6 text-sm text-stone-600">
        New here?{" "}
        <Link href="/register" className="font-medium text-primary-700 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
