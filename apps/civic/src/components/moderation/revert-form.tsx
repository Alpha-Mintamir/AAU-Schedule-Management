"use client";

import { revertRevisionAction } from "@/actions/moderation";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { FieldError, Input, Label } from "@/components/ui/form-controls";

export function RevertForm({ revisionId }: { revisionId: string }) {
  return (
    <details className="rounded-md border border-stone-200 bg-stone-50 p-3">
      <summary className="cursor-pointer text-sm font-medium text-stone-700">
        Revert to this revision (moderator)
      </summary>
      <ActionForm action={revertRevisionAction} className="mt-3 flex flex-wrap items-end gap-3">
        {({ pending, fieldErrors }) => (
          <>
            <input type="hidden" name="revisionId" value={revisionId} />
            <div className="min-w-64 flex-1">
              <Label htmlFor={`revert-reason-${revisionId}`}>Reason</Label>
              <Input
                id={`revert-reason-${revisionId}`}
                name="reason"
                required
                minLength={5}
                maxLength={500}
                placeholder="Why is this revert necessary?"
              />
              <FieldError errors={fieldErrors.reason} />
            </div>
            <SubmitButton pending={pending} variant="danger">
              Revert
            </SubmitButton>
          </>
        )}
      </ActionForm>
    </details>
  );
}
