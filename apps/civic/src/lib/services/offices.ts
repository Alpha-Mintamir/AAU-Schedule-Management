import "server-only";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  governmentOffices,
  governmentOrganizations,
  locations,
  officeServices,
} from "@/lib/db/schema";
import { getDescendantLocationIds } from "./locations";

export type OfficeRow = typeof governmentOffices.$inferSelect;
export type OrganizationRow = typeof governmentOrganizations.$inferSelect;
export type OfficeServiceRow = typeof officeServices.$inferSelect;

export async function listPublishedOffices(options?: {
  locationRootId?: string;
  organizationId?: string;
  limit?: number;
  offset?: number;
}) {
  let locationIds: string[] | undefined;
  if (options?.locationRootId) {
    locationIds = await getDescendantLocationIds(options.locationRootId);
    if (locationIds.length === 0) return [];
  }

  return db
    .select({
      office: governmentOffices,
      organizationName: governmentOrganizations.name,
      organizationSlug: governmentOrganizations.slug,
      locationName: locations.name,
      locationSlug: locations.slug,
    })
    .from(governmentOffices)
    .leftJoin(
      governmentOrganizations,
      eq(governmentOffices.organizationId, governmentOrganizations.id),
    )
    .leftJoin(locations, eq(governmentOffices.locationId, locations.id))
    .where(
      and(
        eq(governmentOffices.status, "published"),
        locationIds ? inArray(governmentOffices.locationId, locationIds) : undefined,
        options?.organizationId
          ? eq(governmentOffices.organizationId, options.organizationId)
          : undefined,
      ),
    )
    .orderBy(desc(governmentOffices.updatedAt))
    .limit(Math.min(options?.limit ?? 50, 100))
    .offset(options?.offset ?? 0);
}

export interface OfficeDetail {
  office: OfficeRow;
  organization: OrganizationRow | null;
  location: typeof locations.$inferSelect | null;
  services: OfficeServiceRow[];
}

export async function getOfficeBySlug(slug: string): Promise<OfficeDetail | null> {
  const office = await db.query.governmentOffices.findFirst({
    where: and(eq(governmentOffices.slug, slug), eq(governmentOffices.status, "published")),
  });
  if (!office) return null;

  const [services, organization, location] = await Promise.all([
    db
      .select()
      .from(officeServices)
      .where(eq(officeServices.officeId, office.id))
      .orderBy(asc(officeServices.createdAt)),
    office.organizationId
      ? db.query.governmentOrganizations.findFirst({
          where: eq(governmentOrganizations.id, office.organizationId),
        })
      : Promise.resolve(undefined),
    office.locationId
      ? db.query.locations.findFirst({ where: eq(locations.id, office.locationId) })
      : Promise.resolve(undefined),
  ]);

  return {
    office,
    organization: organization ?? null,
    location: location ?? null,
    services,
  };
}

export async function listOrganizations() {
  return db.query.governmentOrganizations.findMany({
    orderBy: [asc(governmentOrganizations.slug)],
  });
}

export async function listPopularOffices(limit = 6) {
  return db.query.governmentOffices.findMany({
    where: eq(governmentOffices.status, "published"),
    orderBy: [desc(governmentOffices.updatedAt)],
    limit,
  });
}
