import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasPermission } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import { listSources } from "@/lib/services/sources";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Source registry" };

const RELIABILITY_VARIANT: Record<string, "official" | "success" | "community" | "unknown"> = {
  official: "official",
  reliable: "success",
  community: "community",
  unverified: "unknown",
};

export default async function AdminSourcesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin/sources");
  if (!hasPermission(user.role, "admin:manage_sources")) redirect("/");

  const sources = await listSources();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Sources" }]} />
      <h1 className="mb-1 text-2xl font-bold text-stone-900">Source registry</h1>
      <p className="mb-6 max-w-2xl text-stone-600">
        Every source cited across the platform. Reliability classification controls how source
        badges appear on public pages.
      </p>
      <Card>
        <CardHeader>
          <CardTitle>{sources.length} registered sources</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-2xl text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-xs text-stone-500 uppercase">
                <th scope="col" className="py-2 pr-4 font-medium">Source</th>
                <th scope="col" className="py-2 pr-4 font-medium">Organization</th>
                <th scope="col" className="py-2 pr-4 font-medium">Type</th>
                <th scope="col" className="py-2 pr-4 font-medium">Reliability</th>
                <th scope="col" className="py-2 font-medium">Retrieved</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {sources.map((source) => (
                <tr key={source.id}>
                  <td className="max-w-64 py-2.5 pr-4">
                    {source.url ? (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="font-medium text-primary-700 hover:underline"
                      >
                        {source.title}
                        <ExternalLink aria-hidden="true" className="ml-1 inline size-3" />
                      </a>
                    ) : (
                      <span className="font-medium text-stone-800">{source.title}</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-4 text-stone-600">{source.organization ?? "—"}</td>
                  <td className="py-2.5 pr-4 text-stone-600">{source.type.replace(/_/g, " ")}</td>
                  <td className="py-2.5 pr-4">
                    <Badge variant={RELIABILITY_VARIANT[source.reliability] ?? "unknown"}>
                      {source.reliability}
                    </Badge>
                  </td>
                  <td className="py-2.5 text-stone-600">
                    {source.retrievedAt ? formatDate(source.retrievedAt) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
