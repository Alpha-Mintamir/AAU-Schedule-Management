import { Badge } from "@/components/ui/badge";

/**
 * Trust-state badge. The single place where verification statuses are given
 * their visual identity, so they stay visually consistent everywhere.
 */
const CONFIG: Record<string, { label: string; variant: React.ComponentProps<typeof Badge>["variant"] }> = {
  official: { label: "Official", variant: "official" },
  officially_verified: { label: "Officially Verified", variant: "officiallyVerified" },
  community_verified: { label: "Community Verified", variant: "communityVerified" },
  community_reported: { label: "Community Reported", variant: "communityReported" },
  outdated: { label: "Outdated", variant: "outdated" },
  disputed: { label: "Disputed", variant: "disputed" },
  unknown: { label: "Unverified", variant: "unknown" },
};

export function VerificationBadge({ status }: { status: string }) {
  const config = CONFIG[status] ?? CONFIG.unknown;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

/** OFFICIAL vs COMMUNITY layer badge for individual claims and documents. */
export function LayerBadge({ layer }: { layer: "official" | "community" }) {
  return layer === "official" ? (
    <Badge variant="official">Official</Badge>
  ) : (
    <Badge variant="community">Community</Badge>
  );
}
