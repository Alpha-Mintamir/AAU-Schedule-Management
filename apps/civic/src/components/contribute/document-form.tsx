"use client";

import { submitDocumentAction } from "@/actions/contributions";
import { ActionForm, SubmitButton } from "@/components/action-form";
import {
  FieldError,
  HelpText,
  Input,
  Label,
  Select,
  Textarea,
} from "@/components/ui/form-controls";

export function DocumentForm({ categories }: { categories: Array<{ id: string; label: string }> }) {
  return (
    <ActionForm action={submitDocumentAction} className="space-y-4">
      {({ pending, fieldErrors }) => (
        <>
          <div>
            <Label htmlFor="doc-title">Title</Label>
            <Input
              id="doc-title"
              name="title"
              required
              minLength={3}
              maxLength={160}
              placeholder="e.g. Addis Ababa residential rental agreement (Amharic)"
            />
            <FieldError errors={fieldErrors.title} />
          </div>
          <div>
            <Label htmlFor="doc-description">Description</Label>
            <Textarea
              id="doc-description"
              name="description"
              required
              minLength={10}
              maxLength={2000}
              rows={3}
              placeholder="What is this document, where does it come from, and when is it used?"
            />
            <FieldError errors={fieldErrors.description} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="doc-layer">Origin</Label>
              <Select id="doc-layer" name="layer" required defaultValue="community">
                <option value="community">Community template (created by contributors)</option>
                <option value="official">Official document (from a government source)</option>
              </Select>
              <HelpText>
                Claimed-official documents stay marked “Community Reported” until moderators
                verify them against the source.
              </HelpText>
              <FieldError errors={fieldErrors.layer} />
            </div>
            <div>
              <Label htmlFor="doc-type">Document type</Label>
              <Select id="doc-type" name="docType" required defaultValue="form">
                <option value="form">Government form</option>
                <option value="contract">Contract</option>
                <option value="template">Template</option>
                <option value="letter">Letter</option>
                <option value="application">Application</option>
                <option value="agreement">Agreement</option>
                <option value="other">Other</option>
              </Select>
              <FieldError errors={fieldErrors.docType} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="doc-language">Language</Label>
              <Select id="doc-language" name="language" required defaultValue="am">
                <option value="am">Amharic</option>
                <option value="en">English</option>
                <option value="am+en">Amharic + English</option>
                <option value="other">Other</option>
              </Select>
              <FieldError errors={fieldErrors.language} />
            </div>
            <div>
              <Label htmlFor="doc-category">Category (optional)</Label>
              <Select id="doc-category" name="categoryId" defaultValue="">
                <option value="">No category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </Select>
              <FieldError errors={fieldErrors.categoryId} />
            </div>
          </div>
          <div>
            <Label htmlFor="doc-source">Source URL (required for official documents)</Label>
            <Input
              id="doc-source"
              name="sourceUrl"
              type="url"
              placeholder="https://…"
              maxLength={2000}
            />
            <FieldError errors={fieldErrors.sourceUrl} />
          </div>
          <div>
            <Label htmlFor="doc-file">File</Label>
            <input
              id="doc-file"
              name="file"
              type="file"
              required
              accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg"
              className="block w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-primary-50 file:px-3 file:py-1 file:text-sm file:font-medium file:text-primary-800"
            />
            <HelpText>PDF, DOCX, XLSX, PNG or JPG · up to 10 MB. Content is verified, not just the file name.</HelpText>
            <FieldError errors={fieldErrors.file} />
          </div>
          <SubmitButton pending={pending}>Submit for review</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}
