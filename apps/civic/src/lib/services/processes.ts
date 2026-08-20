import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  categories,
  governmentOffices,
  locations,
  processDurations,
  processFees,
  processRequirements,
  processSteps,
  processes,
} from "@/lib/db/schema";

export type ProcessRow = typeof processes.$inferSelect;
export type ProcessStepRow = typeof processSteps.$inferSelect;
export type ProcessRequirementRow = typeof processRequirements.$inferSelect;
export type ProcessFeeRow = typeof processFees.$inferSelect;
export type ProcessDurationRow = typeof processDurations.$inferSelect;
export type OfficeRow = typeof governmentOffices.$inferSelect;

export async function listPublishedProcesses(options?: {
  categoryId?: string;
  locationId?: string;
  limit?: number;
  offset?: number;
}) {
  return db
    .select({
      process: processes,
      categoryName: categories.name,
      categorySlug: categories.slug,
      locationName: locations.name,
      locationSlug: locations.slug,
    })
    .from(processes)
    .leftJoin(categories, eq(processes.categoryId, categories.id))
    .leftJoin(locations, eq(processes.locationId, locations.id))
    .where(
      and(
        eq(processes.status, "published"),
        options?.categoryId ? eq(processes.categoryId, options.categoryId) : undefined,
        options?.locationId ? eq(processes.locationId, options.locationId) : undefined,
      ),
    )
    .orderBy(desc(processes.updatedAt))
    .limit(Math.min(options?.limit ?? 50, 100))
    .offset(options?.offset ?? 0);
}

export interface ProcessDetail {
  process: ProcessRow;
  category: typeof categories.$inferSelect | null;
  location: typeof locations.$inferSelect | null;
  steps: Array<ProcessStepRow & { office: OfficeRow | null }>;
  requirements: ProcessRequirementRow[];
  fees: ProcessFeeRow[];
  durations: ProcessDurationRow[];
}

export async function getProcessBySlug(slug: string): Promise<ProcessDetail | null> {
  const process = await db.query.processes.findFirst({
    where: and(eq(processes.slug, slug), eq(processes.status, "published")),
  });
  if (!process) return null;

  const [stepRows, requirements, fees, durations, category, location] = await Promise.all([
    db
      .select({ step: processSteps, office: governmentOffices })
      .from(processSteps)
      .leftJoin(governmentOffices, eq(processSteps.officeId, governmentOffices.id))
      .where(eq(processSteps.processId, process.id))
      .orderBy(asc(processSteps.stepNumber)),
    db
      .select()
      .from(processRequirements)
      .where(eq(processRequirements.processId, process.id))
      .orderBy(desc(processRequirements.layer), asc(processRequirements.createdAt)),
    db
      .select()
      .from(processFees)
      .where(eq(processFees.processId, process.id))
      .orderBy(asc(processFees.createdAt)),
    db
      .select()
      .from(processDurations)
      .where(eq(processDurations.processId, process.id))
      .orderBy(asc(processDurations.createdAt)),
    process.categoryId
      ? db.query.categories.findFirst({ where: eq(categories.id, process.categoryId) })
      : Promise.resolve(undefined),
    process.locationId
      ? db.query.locations.findFirst({ where: eq(locations.id, process.locationId) })
      : Promise.resolve(undefined),
  ]);

  return {
    process,
    category: category ?? null,
    location: location ?? null,
    steps: stepRows.map((r) => ({ ...r.step, office: r.office })),
    requirements,
    fees,
    durations,
  };
}

export async function listPopularProcesses(limit = 6) {
  // Popularity signal for the MVP: most recently updated published processes.
  // Swap for view-count ordering when analytics land.
  return db.query.processes.findMany({
    where: eq(processes.status, "published"),
    orderBy: [desc(processes.updatedAt)],
    limit,
  });
}
