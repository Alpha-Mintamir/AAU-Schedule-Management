"use client";

import { useActionState } from "react";
import { confirmNoteAction } from "@/actions/contributions";
import { initialActionState } from "@/lib/action-result";

export function ConfirmButton({ noteId }: { noteId: string }) {
  const [state, formAction, pending] = useActionState(confirmNoteAction, initialActionState);

  if (state.ok) {
    return <span className="text-xs font-medium text-primary-700">Confirmed ✓</span>;
  }

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="noteId" value={noteId} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs font-medium text-stone-500 underline-offset-2 hover:text-primary-700 hover:underline disabled:opacity-50"
      >
        {pending ? "Confirming…" : "This happened to me too"}
      </button>
      {!state.ok && state.error ? (
        <span role="alert" className="ml-2 text-xs text-red-600">
          {state.error}
        </span>
      ) : null}
    </form>
  );
}
