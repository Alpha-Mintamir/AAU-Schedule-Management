"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, type ReactNode } from "react";
import { initialActionState, type ActionResult } from "@/lib/action-result";
import { Alert } from "@/components/ui/alert";

export type FormAction = (prev: ActionResult, formData: FormData) => Promise<ActionResult>;

/**
 * Client wrapper around useActionState: renders server-side errors, shows a
 * success message, redirects when the action requests it, and exposes field
 * errors + pending state to children via render prop.
 */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess,
}: {
  action: FormAction;
  children: (ctx: {
    pending: boolean;
    fieldErrors: Record<string, string[]>;
  }) => ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const router = useRouter();

  useEffect(() => {
    if (state.ok && state.redirectTo) {
      router.push(state.redirectTo);
    }
  }, [state, router]);

  const fieldErrors = !state.ok && state.fieldErrors ? state.fieldErrors : {};

  return (
    <form
      action={formAction}
      className={className}
      key={resetOnSuccess && state.ok ? Date.now() : "form"}
    >
      {!state.ok && state.error ? (
        <Alert variant="error" className="mb-4">
          {state.error}
        </Alert>
      ) : null}
      {state.ok && state.message && !state.redirectTo ? (
        <Alert variant="success" className="mb-4">
          {state.message}
        </Alert>
      ) : null}
      {children({ pending, fieldErrors })}
    </form>
  );
}

export function SubmitButton({
  pending,
  children,
  className,
  variant = "primary",
}: {
  pending: boolean;
  children: ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "danger" | "subtle";
}) {
  const base =
    "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-60";
  const variants: Record<string, string> = {
    primary: "bg-primary-700 text-white hover:bg-primary-800",
    secondary: "border border-stone-300 bg-white text-stone-800 hover:bg-stone-100",
    danger: "bg-red-700 text-white hover:bg-red-800",
    subtle: "bg-primary-50 text-primary-800 hover:bg-primary-100",
  };
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`${base} ${variants[variant]} ${className ?? ""}`}
    >
      {pending ? "Working…" : children}
    </button>
  );
}
