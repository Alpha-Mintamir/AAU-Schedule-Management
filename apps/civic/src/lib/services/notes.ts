import "server-only";
import { and, count, desc, eq, ne } from "drizzle-orm";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import {
  communityNotes,
  contributions,
  noteConfirmations,
  users,
  type entityTypeEnum,
  type noteKindEnum,
} from "@/lib/db/schema";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { adjustReputation } from "./users";
import { REPUTATION_REWARDS } from "./verification-logic";

type EntityType = (typeof entityTypeEnum.enumValues)[number];
type NoteKind = (typeof noteKindEnum.enumValues)[number];

export type NoteWithAuthor = typeof communityNotes.$inferSelect & {
  authorName: string;
  authorRole: string;
};

/** Published community notes for an entity, newest first. */
export async function listPublishedNotes(
  entityType: EntityType,
  entityId: string,
  kind?: NoteKind,
): Promise<NoteWithAuthor[]> {
  const rows = await db
    .select({
      note: communityNotes,
      authorName: users.name,
      authorRole: users.role,
    })
    .from(communityNotes)
    .innerJoin(users, eq(communityNotes.authorId, users.id))
    .where(
      and(
        eq(communityNotes.entityType, entityType),
        eq(communityNotes.entityId, entityId),
        eq(communityNotes.status, "published"),
        kind ? eq(communityNotes.kind, kind) : undefined,
      ),
    )
    .orderBy(desc(communityNotes.confirmCount), desc(communityNotes.createdAt))
    .limit(50);
  return rows.map((r) => ({ ...r.note, authorName: r.authorName, authorRole: r.authorRole }));
}

export async function countPublishedNotes(entityType: EntityType, entityId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(communityNotes)
    .where(
      and(
        eq(communityNotes.entityType, entityType),
        eq(communityNotes.entityId, entityId),
        eq(communityNotes.status, "published"),
      ),
    );
  return row?.value ?? 0;
}

/**
 * Submit a community note. Notes from contributors enter the moderation
 * queue as pending; a linked contribution row makes them reviewable.
 */
export async function submitNote(input: {
  entityType: EntityType;
  entityId: string;
  kind: NoteKind;
  body: string;
  experiencedAt?: Date;
  authorId: string;
}): Promise<{ noteId: string }> {
  return db.transaction(async (tx) => {
    const [note] = await tx
      .insert(communityNotes)
      .values({
        entityType: input.entityType,
        entityId: input.entityId,
        kind: input.kind,
        body: input.body,
        experiencedAt: input.experiencedAt ?? null,
        authorId: input.authorId,
        status: "pending",
      })
      .returning({ id: communityNotes.id });

    await tx.insert(contributions).values({
      userId: input.authorId,
      type: "add_experience",
      entityType: input.entityType,
      entityId: input.entityId,
      noteId: note.id,
      payload: { kind: input.kind, body: input.body },
      status: "pending",
    });

    await audit({
      userId: input.authorId,
      action: "note.submit",
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: { noteId: note.id, kind: input.kind },
    });
    return { noteId: note.id };
  });
}

/** "This happened to me too" — one confirmation per user per note. */
export async function confirmNote(input: { noteId: string; userId: string }): Promise<void> {
  const note = await db.query.communityNotes.findFirst({
    where: eq(communityNotes.id, input.noteId),
  });
  if (!note || note.status !== "published") throw new NotFoundError("Note not found.");
  if (note.authorId === input.userId) {
    throw new ConflictError("You cannot confirm your own report.");
  }
  const existing = await db.query.noteConfirmations.findFirst({
    where: and(
      eq(noteConfirmations.noteId, input.noteId),
      eq(noteConfirmations.userId, input.userId),
    ),
  });
  if (existing) throw new ConflictError("You already confirmed this report.");

  await db.transaction(async (tx) => {
    await tx.insert(noteConfirmations).values({ noteId: input.noteId, userId: input.userId });
    await tx
      .update(communityNotes)
      .set({ confirmCount: note.confirmCount + 1 })
      .where(eq(communityNotes.id, input.noteId));
  });
  await adjustReputation(note.authorId, REPUTATION_REWARDS.confirmedNote);
}

/**
 * Count of confirmations from trusted contributors and above (every role
 * except base contributor), used for "Community Verified by N trusted
 * contributors" trust signals.
 */
export async function countTrustedConfirmations(noteId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(noteConfirmations)
    .innerJoin(users, eq(noteConfirmations.userId, users.id))
    .where(
      and(
        eq(noteConfirmations.noteId, noteId),
        eq(users.status, "active"),
        ne(users.role, "contributor"),
      ),
    );
  return row?.value ?? 0;
}
