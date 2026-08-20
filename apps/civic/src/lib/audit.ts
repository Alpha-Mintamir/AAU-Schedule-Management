import "server-only";
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";

/**
 * Append an entry to the audit log. Audit failures are logged but never
 * allowed to break the underlying operation.
 */
export async function audit(entry: {
  userId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId: entry.userId ?? null,
      action: entry.action,
      entityType: entry.entityType ?? null,
      entityId: entry.entityId ?? null,
      metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
    });
  } catch (error) {
    console.error("audit log write failed", error);
  }
}
