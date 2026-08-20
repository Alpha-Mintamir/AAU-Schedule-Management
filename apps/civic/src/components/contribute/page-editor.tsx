"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { suggestEditAction } from "@/actions/contributions";
import { ActionForm, SubmitButton } from "@/components/action-form";
import {
  FieldError,
  HelpText,
  Input,
  Label,
  Select,
  Textarea,
} from "@/components/ui/form-controls";

interface SectionDraft {
  headingEn: string;
  headingAm: string;
  bodyEn: string;
  bodyAm: string;
  layer: "official" | "community";
}

/**
 * Structured page editor: title/summary in English and Amharic plus an
 * ordered list of sections, each tagged official or community. The section
 * list is serialized to a JSON field; the server re-validates everything.
 */
export function PageEditor({
  pageSlug,
  initial,
}: {
  pageSlug: string;
  initial: {
    titleEn: string;
    titleAm: string;
    summaryEn: string;
    summaryAm: string;
    sections: SectionDraft[];
  };
}) {
  const [sections, setSections] = useState<SectionDraft[]>(
    initial.sections.length > 0
      ? initial.sections
      : [{ headingEn: "", headingAm: "", bodyEn: "", bodyAm: "", layer: "community" }],
  );

  const updateSection = (index: number, patch: Partial<SectionDraft>) => {
    setSections((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  return (
    <ActionForm action={suggestEditAction} className="space-y-6">
      {({ pending, fieldErrors }) => (
        <>
          <input type="hidden" name="pageSlug" value={pageSlug} />
          <input type="hidden" name="sections" value={JSON.stringify(sections)} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="titleEn">Title (English)</Label>
              <Input id="titleEn" name="titleEn" defaultValue={initial.titleEn} required maxLength={160} />
              <FieldError errors={fieldErrors.titleEn} />
            </div>
            <div>
              <Label htmlFor="titleAm">Title (Amharic, optional)</Label>
              <Input id="titleAm" name="titleAm" defaultValue={initial.titleAm} lang="am" maxLength={160} />
              <FieldError errors={fieldErrors.titleAm} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="summaryEn">Summary (English)</Label>
              <Textarea
                id="summaryEn"
                name="summaryEn"
                defaultValue={initial.summaryEn}
                required
                rows={3}
                maxLength={600}
              />
              <FieldError errors={fieldErrors.summaryEn} />
            </div>
            <div>
              <Label htmlFor="summaryAm">Summary (Amharic, optional)</Label>
              <Textarea
                id="summaryAm"
                name="summaryAm"
                defaultValue={initial.summaryAm}
                lang="am"
                rows={3}
                maxLength={600}
              />
              <FieldError errors={fieldErrors.summaryAm} />
            </div>
          </div>

          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-stone-900">Sections</legend>
            <HelpText>
              Mark a section “Official” only if its content comes from an official government
              source — official sections must be backed by citations. Markdown supported:
              headings (##), lists (-), links, **bold**.
            </HelpText>
            {fieldErrors.sections ? <FieldError errors={fieldErrors.sections} /> : null}

            {sections.map((section, index) => (
              <div key={index} className="rounded-lg border border-stone-200 bg-white p-4">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="min-w-48 flex-1">
                    <Label htmlFor={`heading-${index}`}>Heading (English)</Label>
                    <Input
                      id={`heading-${index}`}
                      value={section.headingEn}
                      onChange={(e) => updateSection(index, { headingEn: e.target.value })}
                      maxLength={160}
                      required
                    />
                  </div>
                  <div className="min-w-40">
                    <Label htmlFor={`layer-${index}`}>Information layer</Label>
                    <Select
                      id={`layer-${index}`}
                      value={section.layer}
                      onChange={(e) =>
                        updateSection(index, { layer: e.target.value as "official" | "community" })
                      }
                    >
                      <option value="community">Community</option>
                      <option value="official">Official (cited)</option>
                    </Select>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSections((prev) => prev.filter((_, i) => i !== index))}
                    disabled={sections.length === 1}
                    className="flex h-10 items-center gap-1 rounded-md px-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-40"
                    aria-label={`Remove section ${index + 1}`}
                  >
                    <Trash2 aria-hidden="true" className="size-4" /> Remove
                  </button>
                </div>
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  <div>
                    <Label htmlFor={`body-${index}`}>Content (English)</Label>
                    <Textarea
                      id={`body-${index}`}
                      value={section.bodyEn}
                      onChange={(e) => updateSection(index, { bodyEn: e.target.value })}
                      rows={6}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor={`bodyAm-${index}`}>Content (Amharic, optional)</Label>
                    <Textarea
                      id={`bodyAm-${index}`}
                      value={section.bodyAm}
                      lang="am"
                      onChange={(e) => updateSection(index, { bodyAm: e.target.value })}
                      rows={6}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() =>
                setSections((prev) => [
                  ...prev,
                  { headingEn: "", headingAm: "", bodyEn: "", bodyAm: "", layer: "community" },
                ])
              }
              className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-stone-300 px-3 py-2 text-sm text-stone-600 hover:border-primary-400 hover:text-primary-700"
            >
              <Plus aria-hidden="true" className="size-4" /> Add section
            </button>
          </fieldset>

          <div>
            <Label htmlFor="changeReason">Reason for this change</Label>
            <Input
              id="changeReason"
              name="changeReason"
              required
              minLength={5}
              maxLength={500}
              placeholder="e.g. Updated the required documents based on the new directive"
            />
            <FieldError errors={fieldErrors.changeReason} />
          </div>

          <SubmitButton pending={pending}>Submit edit for review</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}
