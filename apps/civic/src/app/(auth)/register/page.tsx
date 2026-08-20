import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Create an account" };

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/account");

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="text-2xl font-bold text-stone-900">Create an account</h1>
      <p className="mt-1 mb-6 text-sm text-stone-600">
        Contributors help keep civic information accurate for everyone. All contributions are
        reviewed before publishing.
      </p>
      <RegisterForm />
      <p className="mt-6 text-sm text-stone-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary-700 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
