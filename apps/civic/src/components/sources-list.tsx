import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CitationWithSource } from "@/lib/services/sources";
import { formatDate } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  government_website: "Government website",
  government_pdf: "Government PDF",
  official_portal: "Official portal",
  law_or_regulation: "Law / regulation",
  official_announcement: "Official announcement",
  community_submission: "Community submission",
  external_reference: "External reference",
};

const RELIABILITY_VARIANT: Record<string, "official" | "success" | "community" | "unknown"> = {
  official: "official",
  reliable: "success",
  community: "community",
  unverified: "unknown",
};

/**
 * The Sources section: every important claim on a page should be traceable
 * to one of these.
 */
export function SourcesList({ citations }: { citations: CitationWithSource[] }) {
  if (citations.length === 0) return null;
  return (
    <Card id="sources">
      <CardHeader>
        <CardTitle>Sources</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3">
          {citations.map((citation, index) => (
            <li key={citation.id} className="flex gap-3 text-sm">
              <span className="shrink-0 font-mono text-stone-400">[{index + 1}]</span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {citation.source.url ? (
                    <a
                      href={citation.source.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="font-medium text-primary-700 hover:underline"
                    >
                      {citation.source.title}
                      <ExternalLink aria-hidden="true" className="ml-1 inline size-3" />
                    </a>
                  ) : (
                    <span className="font-medium text-stone-800">{citation.source.title}</span>
                  )}
                  <Badge variant={RELIABILITY_VARIANT[citation.source.reliability] ?? "unknown"}>
                    {citation.source.reliability}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-stone-500">
                  {citation.source.organization ? `${citation.source.organization} · ` : ""}
                  {TYPE_LABELS[citation.source.type] ?? citation.source.type}
                  {citation.source.publishedAt
                    ? ` · Published ${formatDate(citation.source.publishedAt)}`
                    : ""}
                  {citation.source.retrievedAt
                    ? ` · Retrieved ${formatDate(citation.source.retrievedAt)}`
                    : ""}
                  {citation.source.version ? ` · Version ${citation.source.version}` : ""}
                </p>
                {citation.note ? <p className="mt-0.5 text-xs text-stone-500">{citation.note}</p> : null}
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
