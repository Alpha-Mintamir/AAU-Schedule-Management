"use client";

import { registerAction } from "@/actions/auth";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { FieldError, HelpText, Input, Label } from "@/components/ui/form-controls";

export function RegisterForm() {
  return (
    <ActionForm action={registerAction} className="space-y-4">
      {({ pending, fieldErrors }) => (
        <>
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" autoComplete="name" required minLength={2} maxLength={80} />
            <HelpText>Shown next to your contributions.</HelpText>
            <FieldError errors={fieldErrors.name} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
            <FieldError errors={fieldErrors.email} />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={10}
            />
            <HelpText>At least 10 characters.</HelpText>
            <FieldError errors={fieldErrors.password} />
          </div>
          <SubmitButton pending={pending} className="w-full">
            Create account
          </SubmitButton>
        </>
      )}
    </ActionForm>
  );
}
