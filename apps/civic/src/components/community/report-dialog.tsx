"use client";

import { Flag } from "lucide-react";
import { reportProblemAction } from "@/actions/contributions";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { FieldError, Label, Select, Textarea } from "@/components/ui/form-controls";

const REASONS = [
  { value: "incorrect_information", label: "Incorrect information" },
  { value: "outdated_information", label: "Outdated information" },
  { value: "fake_document", label: "Fake or misleading document" },
  { value: "wrong_office_location", label: "Wrong office location" },
  { value: "wrong_fees", label: "Wrong fees" },
  { value: "broken_link", label: "Broken link" },
  { value: "misleading_information", label: "Misleading information" },
  { value: "duplicate_page", label: "Duplicate page" },
  { value: "copyright_issue", label: "Copyright issue" },
  { value: "spam_or_abuse", label: "Spam or abuse" },
  { value: "other", label: "Something else" },
];

/**
 * Progressive-disclosure report form. Signed-in users can flag any content;
 * every flag enters the moderation queue.
 */
export function ReportDialog({
  entityType,
  entityId,
  isSignedIn,
}: {
  entityType: string;
  entityId: string;
  isSignedIn: boolean;
}) {
  if (!isSignedIn) {
    return (
      <a
        href={`/login?next=/`}
        className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-red-700"
      >
        <Flag aria-hidden="true" className="size-3.5" /> Sign in to report a problem
      </a>
    );
  }

  return (
    <details className="group">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-sm text-stone-500 hover:text-red-700 [&::-webkit-details-marker]:hidden">
        <Flag aria-hidden="true" className="size-3.5" /> Report a problem
      </summary>
      <div className="mt-3 rounded-lg border border-stone-200 bg-stone-50 p-4">
        <ActionForm action={reportProblemAction} resetOnSuccess className="space-y-3">
          {({ pending, fieldErrors }) => (
            <>
              <input type="hidden" name="entityType" value={entityType} />
              <input type="hidden" name="entityId" value={entityId} />
              <div>
                <Label htmlFor={`reason-${entityId}`}>What is wrong?</Label>
                <Select id={`reason-${entityId}`} name="reason" required defaultValue="outdated_information">
                  {REASONS.map((reason) => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </Select>
                <FieldError errors={fieldErrors.reason} />
              </div>
              <div>
                <Label htmlFor={`details-${entityId}`}>Details (optional)</Label>
                <Textarea
                  id={`details-${entityId}`}
                  name="details"
                  rows={3}
                  maxLength={2000}
                  placeholder="What exactly is wrong, and how do you know?"
                />
                <FieldError errors={fieldErrors.details} />
              </div>
              <SubmitButton pending={pending} variant="secondary">
                Send report to moderators
              </SubmitButton>
            </>
          )}
        </ActionForm>
      </div>
    </details>
  );
}
