/**
 * Minimal line-based diff (LCS) used to compare page revisions.
 * Pure and unit-tested; UI renders the ops as added/removed/context lines.
 */

export type DiffOp =
  | { type: "context"; line: string }
  | { type: "added"; line: string }
  | { type: "removed"; line: string };

export function diffLines(before: string, after: string): DiffOp[] {
  const a = before.split("\n");
  const b = after.split("\n");
  const n = a.length;
  const m = b.length;

  // LCS dynamic programming table.
  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const ops: DiffOp[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push({ type: "context", line: a[i] });
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      ops.push({ type: "removed", line: a[i] });
      i++;
    } else {
      ops.push({ type: "added", line: b[j] });
      j++;
    }
  }
  while (i < n) ops.push({ type: "removed", line: a[i++] });
  while (j < m) ops.push({ type: "added", line: b[j++] });
  return ops;
}

/** Collapse long runs of context, keeping `radius` lines around changes. */
export function compactDiff(ops: DiffOp[], radius = 2): Array<DiffOp | { type: "skip"; count: number }> {
  const keep = new Array<boolean>(ops.length).fill(false);
  ops.forEach((op, index) => {
    if (op.type !== "context") {
      for (let k = Math.max(0, index - radius); k <= Math.min(ops.length - 1, index + radius); k++) {
        keep[k] = true;
      }
    }
  });
  const result: Array<DiffOp | { type: "skip"; count: number }> = [];
  let skipped = 0;
  ops.forEach((op, index) => {
    if (keep[index]) {
      if (skipped > 0) {
        result.push({ type: "skip", count: skipped });
        skipped = 0;
      }
      result.push(op);
    } else {
      skipped++;
    }
  });
  if (skipped > 0) result.push({ type: "skip", count: skipped });
  return result;
}

/**
 * Serialize a page snapshot to a stable, human-readable text form so
 * revisions can be diffed line by line.
 */
export function snapshotToText(snapshot: {
  title?: Record<string, string | undefined>;
  summary?: Record<string, string | undefined>;
  sections?: Array<{
    heading?: Record<string, string | undefined>;
    body?: Record<string, string | undefined>;
    layer?: string;
  }>;
}): string {
  const lines: string[] = [];
  for (const [locale, value] of Object.entries(snapshot.title ?? {})) {
    if (value) lines.push(`Title [${locale}]: ${value}`);
  }
  for (const [locale, value] of Object.entries(snapshot.summary ?? {})) {
    if (value) lines.push(`Summary [${locale}]: ${value}`);
  }
  for (const section of snapshot.sections ?? []) {
    const heading = section.heading?.en ?? Object.values(section.heading ?? {})[0] ?? "";
    lines.push("");
    lines.push(`== ${heading} (${section.layer ?? "community"}) ==`);
    for (const [locale, value] of Object.entries(section.body ?? {})) {
      if (!value) continue;
      if (locale !== "en") lines.push(`[${locale}]`);
      lines.push(...value.split("\n"));
    }
  }
  return lines.join("\n");
}
