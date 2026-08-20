"use client";

import { createPageAction } from "@/actions/contributions";
import { ActionForm, SubmitButton } from "@/components/action-form";
import {
  FieldError,
  HelpText,
  Input,
  Label,
  Select,
  Textarea,
} from "@/components/ui/form-controls";

export function NewPageForm({ categories }: { categories: Array<{ id: string; label: string }> }) {
  return (
    <ActionForm action={createPageAction} className="space-y-4">
      {({ pending, fieldErrors }) => (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="title">Title (English)</Label>
              <Input
                id="title"
                name="title"
                required
                minLength={3}
                maxLength={160}
                placeholder="e.g. How to replace a lost kebele ID"
              />
              <FieldError errors={fieldErrors.title} />
            </div>
            <div>
              <Label htmlFor="titleAm">Title (Amharic, optional)</Label>
              <Input id="titleAm" name="titleAm" lang="am" maxLength={160} />
              <FieldError errors={fieldErrors.titleAm} />
            </div>
          </div>
          <div>
            <Label htmlFor="summary">Summary</Label>
            <Textarea
              id="summary"
              name="summary"
              required
              minLength={10}
              maxLength={600}
              rows={2}
              placeholder="One or two sentences describing what this guide covers."
            />
            <FieldError errors={fieldErrors.summary} />
          </div>
          <div>
            <Label htmlFor="categoryId">Category (optional)</Label>
            <Select id="categoryId" name="categoryId" defaultValue="">
              <option value="">No category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </Select>
            <FieldError errors={fieldErrors.categoryId} />
          </div>
          <div>
            <Label htmlFor="body">Content</Label>
            <Textarea
              id="body"
              name="body"
              required
              rows={12}
              placeholder={"## What you need\n- Document A\n- Document B\n\n## Steps\n1. Go to ..."}
            />
            <HelpText>
              Markdown supported: ## headings, - lists, 1. numbered lists, **bold**, [links](https://…).
              Your content is published as community knowledge; official claims need cited sources
              added during review.
            </HelpText>
            <FieldError errors={fieldErrors.body} />
          </div>
          <div>
            <Label htmlFor="changeReason">Why is this guide needed?</Label>
            <Input
              id="changeReason"
              name="changeReason"
              required
              minLength={5}
              maxLength={500}
              placeholder="e.g. Many people ask about this and there is no reliable guide"
            />
            <FieldError errors={fieldErrors.changeReason} />
          </div>
          <SubmitButton pending={pending}>Submit for review</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}
