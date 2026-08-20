"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ActionResult } from "@/lib/action-result";
import { createSession, destroySession } from "@/lib/auth/session";
import { enforceRateLimit } from "@/lib/rate-limit";
import { runAction, parseOrThrow } from "@/lib/safe-action";
import { authenticateUser, registerUser } from "@/lib/services/users";
import { loginSchema, registerSchema } from "@/lib/validation/auth";

async function clientKey(): Promise<string> {
  const headerStore = await headers();
  // Behind a proxy the first x-forwarded-for hop is the client; fall back to
  // a constant key (still rate limited globally) when unavailable.
  const forwarded = headerStore.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

export async function registerAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  return runAction(async () => {
    enforceRateLimit("register", await clientKey());
    const input = parseOrThrow(registerSchema, {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
    });
    const { id } = await registerUser(input);
    const headerStore = await headers();
    await createSession(id, headerStore.get("user-agent"));
    return { ok: true, redirectTo: "/account" };
  });
}

export async function loginAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    enforceRateLimit("login", await clientKey());
    const input = parseOrThrow(loginSchema, {
      email: formData.get("email"),
      password: formData.get("password"),
    });
    const { id } = await authenticateUser(input);
    const headerStore = await headers();
    await createSession(id, headerStore.get("user-agent"));
    const next = formData.get("next");
    const redirectTo =
      typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
        ? next
        : "/account";
    return { ok: true, redirectTo };
  });
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}
