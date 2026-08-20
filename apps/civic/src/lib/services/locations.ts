import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { locations } from "@/lib/db/schema";

export type LocationRow = typeof locations.$inferSelect;

export async function listLocations(): Promise<LocationRow[]> {
  return db.query.locations.findMany({ orderBy: [asc(locations.type), asc(locations.slug)] });
}

export async function getLocationBySlug(slug: string): Promise<LocationRow | undefined> {
  return db.query.locations.findFirst({ where: eq(locations.slug, slug) });
}

export async function listChildren(parentId: string): Promise<LocationRow[]> {
  return db.query.locations.findMany({
    where: eq(locations.parentId, parentId),
    orderBy: [asc(locations.slug)],
  });
}

/** Walk up the hierarchy for breadcrumbs: country -> ... -> this location. */
export async function getLocationAncestry(location: LocationRow): Promise<LocationRow[]> {
  const chain: LocationRow[] = [location];
  let current = location;
  // The hierarchy is at most 5 levels deep (country..woreda).
  for (let i = 0; i < 6 && current.parentId; i++) {
    const parent = await db.query.locations.findFirst({ where: eq(locations.id, current.parentId) });
    if (!parent) break;
    chain.unshift(parent);
    current = parent;
  }
  return chain;
}

/** All descendant location ids (inclusive), for "offices in this area" queries. */
export async function getDescendantLocationIds(rootId: string): Promise<string[]> {
  const all = await db
    .select({ id: locations.id, parentId: locations.parentId })
    .from(locations);
  const childrenByParent = new Map<string, string[]>();
  for (const row of all) {
    if (!row.parentId) continue;
    const list = childrenByParent.get(row.parentId) ?? [];
    list.push(row.id);
    childrenByParent.set(row.parentId, list);
  }
  const result: string[] = [];
  const stack = [rootId];
  while (stack.length > 0) {
    const id = stack.pop()!;
    result.push(id);
    stack.push(...(childrenByParent.get(id) ?? []));
  }
  return result;
}
