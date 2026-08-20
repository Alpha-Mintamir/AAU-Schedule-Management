/**
 * Shared result shape for server actions consumed by useActionState forms.
 */
export type ActionResult =
  | { ok: true; message?: string; redirectTo?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export const initialActionState: ActionResult = { ok: false, error: "" };
