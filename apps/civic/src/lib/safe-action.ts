import "server-only";
import { ZodError } from "zod";
import type { ActionResult } from "./action-result";
import { AppError, ValidationError } from "./errors";

/**
 * Centralized error handling for server actions: AppError subclasses map to
 * user-facing messages; Zod errors map to field errors; anything else is
 * logged server-side and returned as a generic failure so internals never
 * leak to the client.
 */
export async function runAction(fn: () => Promise<ActionResult>): Promise<ActionResult> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof ValidationError) {
      return { ok: false, error: error.message, fieldErrors: error.fieldErrors };
    }
    if (error instanceof AppError) {
      return { ok: false, error: error.message };
    }
    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of error.issues) {
        const key = issue.path.join(".") || "_";
        (fieldErrors[key] ??= []).push(issue.message);
      }
      return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
    }
    console.error("Unhandled action error:", error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

/** Parse with Zod, returning field errors in the shared shape on failure. */
export function parseOrThrow<T>(schema: { safeParse: (v: unknown) => { success: boolean; data?: T; error?: ZodError } }, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success || result.data === undefined) {
    throw result.error ?? new ValidationError("Invalid input.");
  }
  return result.data;
}
