import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "@/lib/env";
import { ValidationError } from "@/lib/errors";

/**
 * Object storage abstraction. Uploaded files are stored under opaque keys
 * and only ever served through the access-controlled download route — never
 * from a public directory or raw database record. The default provider
 * writes to the local filesystem; an S3-compatible provider can be swapped
 * in behind the same interface for production deployments.
 */
export interface StorageProvider {
  put(key: string, data: Buffer): Promise<void>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
}

class LocalStorageProvider implements StorageProvider {
  private readonly root: string;

  constructor(root: string) {
    this.root = path.resolve(root);
  }

  private resolve(key: string): string {
    const resolved = path.resolve(this.root, key);
    // Defense in depth: keys are generated server-side, but never allow
    // traversal outside the storage root regardless.
    if (!resolved.startsWith(this.root + path.sep)) {
      throw new ValidationError("Invalid storage key.");
    }
    return resolved;
  }

  async put(key: string, data: Buffer): Promise<void> {
    const filePath = this.resolve(key);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, data);
  }

  async get(key: string): Promise<Buffer> {
    return readFile(this.resolve(key));
  }

  async delete(key: string): Promise<void> {
    await unlink(this.resolve(key)).catch(() => undefined);
  }
}

const globalForStorage = globalThis as unknown as { storageProvider?: StorageProvider };
export const storage: StorageProvider = (globalForStorage.storageProvider ??=
  new LocalStorageProvider(env.STORAGE_DIR));

/**
 * Malware scanning hook. The MVP ships a pass-through scanner; the interface
 * exists so a real engine (ClamAV, VirusTotal, cloud scanning) can be wired
 * in without changing upload flows. Files remain quarantined from public
 * download until their document is approved by a moderator.
 */
export interface MalwareScanner {
  scan(data: Buffer): Promise<"clean" | "infected" | "unscanned">;
}

class NoopScanner implements MalwareScanner {
  async scan(): Promise<"unscanned"> {
    return "unscanned";
  }
}

export const malwareScanner: MalwareScanner = new NoopScanner();

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Allowed upload types with their magic-byte signatures. MIME headers from
 * the client are untrusted; the actual file content is checked.
 */
const FILE_SIGNATURES: Array<{
  format: string;
  mimeType: string;
  check: (buf: Buffer) => boolean;
}> = [
  {
    format: "pdf",
    mimeType: "application/pdf",
    check: (buf) => buf.subarray(0, 5).toString("latin1") === "%PDF-",
  },
  {
    // DOCX/XLSX are ZIP containers; distinguish by internal path.
    format: "docx",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    check: (buf) => isZip(buf) && buf.includes(Buffer.from("word/")),
  },
  {
    format: "xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    check: (buf) => isZip(buf) && buf.includes(Buffer.from("xl/")),
  },
  {
    format: "png",
    mimeType: "image/png",
    check: (buf) => buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    format: "jpg",
    mimeType: "image/jpeg",
    check: (buf) => buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff,
  },
];

function isZip(buf: Buffer): boolean {
  return buf[0] === 0x50 && buf[1] === 0x4b && (buf[2] === 0x03 || buf[2] === 0x05);
}

export interface ValidatedUpload {
  data: Buffer;
  format: string;
  mimeType: string;
  sha256: string;
  size: number;
}

/**
 * Validate an uploaded file: size limit, magic-byte content sniffing (client
 * MIME is ignored), and malware scan hook. Throws ValidationError on any
 * failure.
 */
export async function validateUpload(file: File): Promise<ValidatedUpload> {
  if (file.size === 0) throw new ValidationError("The uploaded file is empty.");
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ValidationError(
      `File is too large. Maximum size is ${Math.floor(MAX_UPLOAD_BYTES / (1024 * 1024))} MB.`,
    );
  }
  const data = Buffer.from(await file.arrayBuffer());
  const match = FILE_SIGNATURES.find((sig) => sig.check(data));
  if (!match) {
    throw new ValidationError(
      "Unsupported file type. Allowed formats: PDF, DOCX, XLSX, PNG, JPG.",
    );
  }
  const scanResult = await malwareScanner.scan(data);
  if (scanResult === "infected") {
    throw new ValidationError("The uploaded file failed the malware scan.");
  }
  return {
    data,
    format: match.format,
    mimeType: match.mimeType,
    sha256: createHash("sha256").update(data).digest("hex"),
    size: data.length,
  };
}

/** Opaque storage key: sharded random name, no user-controlled parts. */
export function generateStorageKey(format: string): string {
  const random = randomBytes(16).toString("hex");
  return `documents/${random.slice(0, 2)}/${random}.${format}`;
}
