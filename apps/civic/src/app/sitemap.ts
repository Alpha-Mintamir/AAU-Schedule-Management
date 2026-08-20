import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  documents,
  governmentOffices,
  knowledgePages,
  locations,
  processes,
} from "@/lib/db/schema";
import { env } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");

  const [pageRows, processRows, officeRows, documentRows, locationRows] = await Promise.all([
    db
      .select({ slug: knowledgePages.slug, updatedAt: knowledgePages.updatedAt })
      .from(knowledgePages)
      .where(eq(knowledgePages.status, "published")),
    db
      .select({ slug: processes.slug, updatedAt: processes.updatedAt })
      .from(processes)
      .where(eq(processes.status, "published")),
    db
      .select({ slug: governmentOffices.slug, updatedAt: governmentOffices.updatedAt })
      .from(governmentOffices)
      .where(eq(governmentOffices.status, "published")),
    db
      .select({ slug: documents.slug, updatedAt: documents.updatedAt })
      .from(documents)
      .where(eq(documents.status, "published")),
    db.select({ slug: locations.slug }).from(locations),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/processes`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/documents`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/offices`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/pages`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/locations`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/contribute`, changeFrequency: "monthly", priority: 0.5 },
  ];

  return [
    ...staticRoutes,
    ...pageRows.map((row) => ({
      url: `${base}/pages/${row.slug}`,
      lastModified: row.updatedAt,
      priority: 0.8,
    })),
    ...processRows.map((row) => ({
      url: `${base}/processes/${row.slug}`,
      lastModified: row.updatedAt,
      priority: 0.8,
    })),
    ...officeRows.map((row) => ({
      url: `${base}/offices/${row.slug}`,
      lastModified: row.updatedAt,
      priority: 0.7,
    })),
    ...documentRows.map((row) => ({
      url: `${base}/documents/${row.slug}`,
      lastModified: row.updatedAt,
      priority: 0.7,
    })),
    ...locationRows.map((row) => ({
      url: `${base}/locations/${row.slug}`,
      priority: 0.6,
    })),
  ];
}
