import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { audit } from "@/lib/audit";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import type { UserRole } from "@/lib/auth/permissions";
import { AppError, ValidationError } from "@/lib/errors";

export async function registerUser(input: {
  email: string;
  password: string;
  name: string;
}): Promise<{ id: string }> {
  const email = input.email.trim().toLowerCase();
  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) {
    throw new ValidationError("An account with this email already exists.", {
      email: ["An account with this email already exists."],
    });
  }
  const passwordHash = await hashPassword(input.password);
  const [user] = await db
    .insert(users)
    .values({ email, passwordHash, name: input.name.trim() })
    .returning({ id: users.id });
  await audit({ userId: user.id, action: "user.register" });
  return user;
}

export async function authenticateUser(input: {
  email: string;
  password: string;
}): Promise<{ id: string }> {
  const email = input.email.trim().toLowerCase();
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  // Verify against a dummy hash when the user doesn't exist so response
  // timing does not reveal whether an email is registered.
  const hash =
    user?.passwordHash ??
    "scrypt:16384:8:1:00000000000000000000000000000000:0000000000000000000000000000000000000000000000000000000000000000";
  const valid = await verifyPassword(input.password, hash);
  if (!user || !valid) {
    throw new AppError("Invalid email or password.", "invalid_credentials", 401);
  }
  if (user.status !== "active") {
    throw new AppError("This account has been suspended.", "account_suspended", 403);
  }
  await audit({ userId: user.id, action: "user.login" });
  return { id: user.id };
}

export async function setUserRole(input: {
  userId: string;
  role: UserRole;
  actorId: string;
}): Promise<void> {
  await db
    .update(users)
    .set({ role: input.role, updatedAt: new Date() })
    .where(eq(users.id, input.userId));
  await audit({
    userId: input.actorId,
    action: "user.set_role",
    entityType: "user",
    entityId: input.userId,
    metadata: { role: input.role },
  });
}

export async function setUserStatus(input: {
  userId: string;
  status: "active" | "suspended" | "banned";
  actorId: string;
}): Promise<void> {
  await db
    .update(users)
    .set({ status: input.status, updatedAt: new Date() })
    .where(eq(users.id, input.userId));
  await audit({
    userId: input.actorId,
    action: "user.set_status",
    entityType: "user",
    entityId: input.userId,
    metadata: { status: input.status },
  });
}

export async function adjustReputation(userId: string, delta: number): Promise<void> {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) return;
  await db
    .update(users)
    .set({ reputation: Math.max(0, user.reputation + delta), updatedAt: new Date() })
    .where(eq(users.id, userId));
}
