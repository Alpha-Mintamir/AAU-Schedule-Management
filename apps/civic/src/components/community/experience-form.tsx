"use client";

import { submitExperienceAction } from "@/actions/contributions";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { FieldError, HelpText, Label, Select, Textarea } from "@/components/ui/form-controls";

const KIND_OPTIONS = [
  { value: "experience", label: "I completed this — here is my experience" },
  { value: "tip", label: "Practical tip" },
  { value: "problem", label: "Common problem I encountered" },
  { value: "fee_report", label: "Fee I was charged" },
  { value: "time_report", label: "How long it actually took" },
  { value: "document_report", label: "Documents I was actually asked for" },
  { value: "office_update", label: "Office change (moved, hours, services)" },
  { value: "correction", label: "Correction to this page" },
];

export function ExperienceForm({
  entityType,
  entityId,
}: {
  entityType: string;
  entityId: string;
}) {
  return (
    <ActionForm action={submitExperienceAction} resetOnSuccess className="space-y-3">
      {({ pending, fieldErrors }) => (
        <>
          <input type="hidden" name="entityType" value={entityType} />
          <input type="hidden" name="entityId" value={entityId} />
          <div>
            <Label htmlFor={`kind-${entityId}`}>What are you sharing?</Label>
            <Select id={`kind-${entityId}`} name="kind" defaultValue="experience" required>
              {KIND_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <FieldError errors={fieldErrors.kind} />
          </div>
          <div>
            <Label htmlFor={`body-${entityId}`}>Your report</Label>
            <Textarea
              id={`body-${entityId}`}
              name="body"
              required
              minLength={20}
              maxLength={5000}
              rows={4}
              placeholder="Describe what happened, which office, what was required, what it cost…"
              aria-describedby={`body-help-${entityId}`}
            />
            <HelpText>
              <span id={`body-help-${entityId}`}>
                Be factual and specific. Your report is reviewed by moderators before it appears,
                and is always shown as community experience — never as official information.
              </span>
            </HelpText>
            <FieldError errors={fieldErrors.body} />
          </div>
          <div className="max-w-52">
            <Label htmlFor={`experiencedAt-${entityId}`}>When did this happen? (optional)</Label>
            <input
              id={`experiencedAt-${entityId}`}
              name="experiencedAt"
              type="date"
              className="block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
            />
            <FieldError errors={fieldErrors.experiencedAt} />
          </div>
          <SubmitButton pending={pending}>Submit for review</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}
