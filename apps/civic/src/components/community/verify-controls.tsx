"use client";

import { ShieldCheck } from "lucide-react";
import { markStateAction, verifyEntityAction } from "@/actions/moderation";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { FieldError, Label, Select } from "@/components/ui/form-controls";

/**
 * Reviewer/moderator controls to record verification events or mark content
 * outdated/disputed. Rendered only when the current user holds the relevant
 * permission (checked server-side; actions re-check on submit).
 */
export function VerifyControls({
  entityType,
  entityId,
  canMarkState,
}: {
  entityType: string;
  entityId: string;
  canMarkState: boolean;
}) {
  return (
    <details className="rounded-lg border border-primary-200 bg-primary-50/50">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium text-primary-800 [&::-webkit-details-marker]:hidden">
        <ShieldCheck aria-hidden="true" className="size-4" /> Reviewer tools
      </summary>
      <div className="space-y-4 border-t border-primary-100 px-4 py-4">
        <ActionForm action={verifyEntityAction} className="flex flex-wrap items-end gap-3">
          {({ pending, fieldErrors }) => (
            <>
              <input type="hidden" name="entityType" value={entityType} />
              <input type="hidden" name="entityId" value={entityId} />
              <div className="min-w-56">
                <Label htmlFor={`method-${entityId}`}>Record verification</Label>
                <Select id={`method-${entityId}`} name="method" defaultValue="official_source_check">
                  <option value="official_source_check">Checked against official source</option>
                  <option value="moderator_review">Moderator review</option>
                  <option value="community_confirmation">Community confirmation</option>
                  <option value="in_person_check">Checked in person</option>
                </Select>
                <FieldError errors={fieldErrors.method} />
              </div>
              <SubmitButton pending={pending} variant="subtle">
                Mark verified
              </SubmitButton>
            </>
          )}
        </ActionForm>

        {canMarkState ? (
          <ActionForm action={markStateAction} className="flex flex-wrap items-end gap-3">
            {({ pending, fieldErrors }) => (
              <>
                <input type="hidden" name="entityType" value={entityType} />
                <input type="hidden" name="entityId" value={entityId} />
                <div className="min-w-56">
                  <Label htmlFor={`state-${entityId}`}>Flag trust state</Label>
                  <Select id={`state-${entityId}`} name="status" defaultValue="outdated">
                    <option value="outdated">Mark as outdated</option>
                    <option value="disputed">Mark as disputed</option>
                  </Select>
                  <FieldError errors={fieldErrors.status} />
                </div>
                <SubmitButton pending={pending} variant="secondary">
                  Apply
                </SubmitButton>
              </>
            )}
          </ActionForm>
        ) : null}
      </div>
    </details>
  );
}
