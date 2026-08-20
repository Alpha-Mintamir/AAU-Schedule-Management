import Link from "next/link";
import { Building2, FileText, MapPin, Route, ScrollText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { lt } from "@/lib/i18n";
import type { RelatedItem } from "@/lib/services/related";

const ICONS = {
  knowledge_page: ScrollText,
  process: Route,
  office: Building2,
  document: FileText,
  organization: Building2,
  location: MapPin,
} as const;

export function RelatedList({ items, title = "Related" }: { items: RelatedItem[]; title?: string }) {
  if (items.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1.5">
          {items.map((item) => {
            const Icon = ICONS[item.entityType];
            return (
              <li key={`${item.entityType}-${item.entityId}`}>
                <Link
                  href={item.url}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-stone-700 hover:bg-stone-50 hover:text-primary-800"
                >
                  <Icon aria-hidden="true" className="size-3.5 shrink-0 text-stone-400" />
                  {lt(item.title)}
                </Link>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
