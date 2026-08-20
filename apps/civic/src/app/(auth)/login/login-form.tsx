"use client";

import { loginAction } from "@/actions/auth";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { FieldError, Input, Label } from "@/components/ui/form-controls";

export function LoginForm({ next }: { next?: string }) {
  return (
    <ActionForm action={loginAction} className="space-y-4">
      {({ pending, fieldErrors }) => (
        <>
          {next ? <input type="hidden" name="next" value={next} /> : null}
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
              autoComplete="current-password"
              required
            />
            <FieldError errors={fieldErrors.password} />
          </div>
          <SubmitButton pending={pending} className="w-full">
            Sign in
          </SubmitButton>
        </>
      )}
    </ActionForm>
  );
}
