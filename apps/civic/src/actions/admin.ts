"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/action-result";
import { requirePermission } from "@/lib/auth/session";
import { ValidationError } from "@/lib/errors";
import { runAction, parseOrThrow } from "@/lib/safe-action";
import { setUserRole, setUserStatus } from "@/lib/services/users";
import { setRoleSchema, setUserStatusSchema } from "@/lib/validation/moderation";

export async function setUserRoleAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  return runAction(async () => {
    const admin = await requirePermission("admin:manage_roles");
    const input = parseOrThrow(setRoleSchema, {
      userId: formData.get("userId"),
      role: formData.get("role"),
    });
    if (input.userId === admin.id) {
      throw new ValidationError("You cannot change your own role.");
    }
    await setUserRole({ userId: input.userId, role: input.role, actorId: admin.id });
    revalidatePath("/admin/users");
    return { ok: true, message: "Role updated." };
  });
}

export async function setUserStatusAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  return runAction(async () => {
    const admin = await requirePermission("admin:manage_users");
    const input = parseOrThrow(setUserStatusSchema, {
      userId: formData.get("userId"),
      status: formData.get("status"),
    });
    if (input.userId === admin.id) {
      throw new ValidationError("You cannot change your own account status.");
    }
    await setUserStatus({ userId: input.userId, status: input.status, actorId: admin.id });
    revalidatePath("/admin/users");
    return { ok: true, message: "Account status updated." };
  });
}
