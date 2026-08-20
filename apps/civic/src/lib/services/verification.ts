import "server-only";
import { and, eq } from "drizzle-orm";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import {
  documents,
  governmentOffices,
  knowledgePages,
  processes,
  verifications,
  type entityTypeEnum,
  type verificationMethodEnum,
} from "@/lib/db/schema";
import { NotFoundError } from "@/lib/errors";
import {
  indexDocument,
  indexKnowledgePage,
  indexOffice,
  indexProcess,
} from "@/lib/search/indexer";
import { nextStatus, type VerificationStatus } from "./verification-logic";

type EntityType = (typeof entityTypeEnum.enumValues)[number];
type VerificationMethod = (typeof verificationMethodEnum.enumValues)[number];

const VERIFIABLE_TABLES = {
  knowledge_page: knowledgePages,
  process: processes,
  office: governmentOffices,
  document: documents,
} as const;

type VerifiableEntityType = keyof typeof VERIFIABLE_TABLES;

export function isVerifiableEntity(entityType: EntityType): entityType is VerifiableEntityType {
  return entityType in VERIFIABLE_TABLES;
}

async function reindex(entityType: VerifiableEntityType, entityId: string): Promise<void> {
  switch (entityType) {
    case "knowledge_page":
      return indexKnowledgePage(entityId);
    case "process":
      return indexProcess(entityId);
    case "office":
      return indexOffice(entityId);
    case "document":
      return indexDocument(entityId);
  }
}

async function setEntityStatus(
  entityType: VerifiableEntityType,
  entityId: string,
  status: VerificationStatus,
  touchVerifiedAt: boolean,
): Promise<void> {
  const table = VERIFIABLE_TABLES[entityType];
  const [updated] = await db
    .update(table)
    .set({
      verificationStatus: status,
      ...(touchVerifiedAt ? { lastVerifiedAt: new Date() } : {}),
      updatedAt: new Date(),
    })
    .where(eq(table.id, entityId))
    .returning({ id: table.id });
  if (!updated) throw new NotFoundError();
  await reindex(entityType, entityId);
}

/**
 * Record a verification event and derive the entity's new trust state.
 * The event itself is an immutable audit record in `verifications`.
 */
export async function recordVerification(input: {
  entityType: VerifiableEntityType;
  entityId: string;
  verifiedById: string;
  method: VerificationMethod;
  sourceId?: string;
  note?: string;
}): Promise<void> {
  const table = VERIFIABLE_TABLES[input.entityType];
  const current = await db
    .select({ verificationStatus: table.verificationStatus })
    .from(table)
    .where(eq(table.id, input.entityId))
    .limit(1);
  if (current.length === 0) throw new NotFoundError();

  await db.insert(verifications).values({
    entityType: input.entityType,
    entityId: input.entityId,
    verifiedById: input.verifiedById,
    method: input.method,
    sourceId: input.sourceId ?? null,
    note: input.note ?? null,
  });

  const status = nextStatus(
    current[0].verificationStatus as VerificationStatus,
    input.method,
  );
  await setEntityStatus(input.entityType, input.entityId, status, true);
  await audit({
    userId: input.verifiedById,
    action: "verification.record",
    entityType: input.entityType,
    entityId: input.entityId,
    metadata: { method: input.method, status },
  });
}

/** Moderator marks information as outdated or disputed (does not touch lastVerifiedAt). */
export async function markVerificationState(input: {
  entityType: VerifiableEntityType;
  entityId: string;
  status: Extract<VerificationStatus, "outdated" | "disputed">;
  actorId: string;
  note?: string;
}): Promise<void> {
  await setEntityStatus(input.entityType, input.entityId, input.status, false);
  await audit({
    userId: input.actorId,
    action: `verification.mark_${input.status}`,
    entityType: input.entityType,
    entityId: input.entityId,
    metadata: input.note ? { note: input.note } : undefined,
  });
}

export async function listVerifications(entityType: EntityType, entityId: string) {
  return db.query.verifications.findMany({
    where: and(eq(verifications.entityType, entityType), eq(verifications.entityId, entityId)),
    orderBy: (v, { desc }) => [desc(v.createdAt)],
    limit: 20,
  });
}
