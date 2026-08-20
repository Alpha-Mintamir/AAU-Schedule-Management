import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, tags, entityTags } from "@/lib/db/schema";

export async function listCategories() {
  return db.query.categories.findMany({ orderBy: [asc(categories.sortOrder)] });
}

export async function getCategoryBySlug(slug: string) {
  return db.query.categories.findFirst({ where: eq(categories.slug, slug) });
}

export async function listTagsForEntity(
  entityType: (typeof entityTags.$inferSelect)["entityType"],
  entityId: string,
) {
  const rows = await db
    .select({ id: tags.id, slug: tags.slug, name: tags.name })
    .from(entityTags)
    .innerJoin(tags, eq(entityTags.tagId, tags.id))
    .where(and(eq(entityTags.entityType, entityType), eq(entityTags.entityId, entityId)));
  return rows;
}
