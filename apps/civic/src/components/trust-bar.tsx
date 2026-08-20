import { CalendarCheck, MessageSquare } from "lucide-react";
import { VerificationBadge } from "@/components/verification-badge";
import { formatMonthYear } from "@/lib/utils";

/**
 * Standard trust strip shown under every content title: verification status,
 * last-verified date, and how many community reports exist.
 */
export function TrustBar({
  verificationStatus,
  lastVerifiedAt,
  communityReportCount,
}: {
  verificationStatus: string;
  lastVerifiedAt: Date | null;
  communityReportCount: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-stone-500">
      <VerificationBadge status={verificationStatus} />
      <span className="inline-flex items-center gap-1.5">
        <CalendarCheck aria-hidden="true" className="size-3.5" />
        {lastVerifiedAt ? `Last verified ${formatMonthYear(lastVerifiedAt)}` : "Not yet verified"}
      </span>
      <a href="#community" className="inline-flex items-center gap-1.5 hover:text-primary-700 hover:underline">
        <MessageSquare aria-hidden="true" className="size-3.5" />
        {communityReportCount} community report{communityReportCount === 1 ? "" : "s"}
      </a>
    </div>
  );
}
