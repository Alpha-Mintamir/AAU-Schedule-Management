"use client";

import {
  approveContributionAction,
  rejectContributionAction,
  resolveFlagAction,
} from "@/actions/moderation";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { FieldError, Input, Label } from "@/components/ui/form-controls";

export function ContributionDecisionForms({ contributionId }: { contributionId: string }) {
  return (
    <div className="flex flex-col gap-3 border-t border-stone-100 pt-3 sm:flex-row sm:items-start">
      <ActionForm action={approveContributionAction} className="flex flex-wrap items-end gap-2">
        {({ pending }) => (
          <>
            <input type="hidden" name="contributionId" value={contributionId} />
            <div>
              <Label htmlFor={`approve-note-${contributionId}`}>Note (optional)</Label>
              <Input
                id={`approve-note-${contributionId}`}
                name="reviewNote"
                maxLength={1000}
                className="w-56"
              />
            </div>
            <SubmitButton pending={pending}>Approve &amp; publish</SubmitButton>
          </>
        )}
      </ActionForm>

      <ActionForm action={rejectContributionAction} className="flex flex-wrap items-end gap-2">
        {({ pending, fieldErrors }) => (
          <>
            <input type="hidden" name="contributionId" value={contributionId} />
            <div>
              <Label htmlFor={`reject-note-${contributionId}`}>Reason (required)</Label>
              <Input
                id={`reject-note-${contributionId}`}
                name="reviewNote"
                required
                minLength={5}
                maxLength={1000}
                className="w-56"
              />
              <FieldError errors={fieldErrors.reviewNote} />
            </div>
            <label className="flex items-center gap-1.5 pb-2.5 text-xs text-stone-600">
              <input type="checkbox" name="needsClarification" className="size-3.5" />
              Needs clarification
            </label>
            <SubmitButton pending={pending} variant="danger">
              Reject
            </SubmitButton>
          </>
        )}
      </ActionForm>
    </div>
  );
}

export function FlagResolutionForm({ flagId }: { flagId: string }) {
  return (
    <ActionForm
      action={resolveFlagAction}
      className="flex flex-wrap items-end gap-2 border-t border-stone-100 pt-3"
    >
      {({ pending }) => (
        <>
          <input type="hidden" name="flagId" value={flagId} />
          <div className="min-w-56 flex-1">
            <Label htmlFor={`resolution-note-${flagId}`}>Resolution note (optional)</Label>
            <Input id={`resolution-note-${flagId}`} name="resolutionNote" maxLength={1000} />
          </div>
          {/* Two submit buttons: the clicked button's value is sent as `resolution`. */}
          <button
            type="submit"
            name="resolution"
            value="resolved"
            disabled={pending}
            className="inline-flex h-10 items-center rounded-md bg-primary-700 px-4 text-sm font-medium text-white hover:bg-primary-800 disabled:opacity-60"
          >
            Mark resolved
          </button>
          <button
            type="submit"
            name="resolution"
            value="dismissed"
            disabled={pending}
            className="inline-flex h-10 items-center rounded-md border border-stone-300 bg-white px-4 text-sm font-medium text-stone-700 hover:bg-stone-100 disabled:opacity-60"
          >
            Dismiss
          </button>
        </>
      )}
    </ActionForm>
  );
}
