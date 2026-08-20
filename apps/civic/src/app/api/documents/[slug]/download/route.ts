import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { audit } from "@/lib/audit";
import {
  canDownloadDocument,
  getDocumentWithVersionById,
} from "@/lib/services/documents";
import { storage } from "@/lib/storage";

/**
 * Access-controlled document download. Files are never exposed directly:
 * this route checks the document's access policy against the current user,
 * then streams the file from object storage with a safe content type and
 * attachment disposition (so browsers never render uploaded content inline).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await params;

  const doc = await db.query.documents.findFirst({ where: eq(documents.slug, slug) });
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const user = await getCurrentUser();
  if (!canDownloadDocument(doc, user)) {
    // 404 (not 403) so the existence of restricted documents is not leaked.
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const withVersion = await getDocumentWithVersionById(doc.id);
  const version = withVersion?.currentVersion;
  if (!version) {
    return NextResponse.json({ error: "No file available" }, { status: 404 });
  }

  let data: Buffer;
  try {
    data = await storage.get(version.storageKey);
  } catch {
    return NextResponse.json({ error: "File unavailable" }, { status: 404 });
  }

  await audit({
    userId: user?.id ?? null,
    action: "document.download",
    entityType: "document",
    entityId: doc.id,
  });

  const filename = `${doc.slug}.${version.format}`;
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": version.mimeType,
      "Content-Length": String(version.fileSize),
      "Content-Disposition": `attachment; filename="${filename}"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}
