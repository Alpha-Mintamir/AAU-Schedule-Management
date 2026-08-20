import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide whitespace-nowrap",
  {
    variants: {
      variant: {
        neutral: "bg-stone-200 text-stone-700",
        official: "bg-primary-700 text-white",
        officiallyVerified: "bg-primary-100 text-primary-800 ring-1 ring-primary-300",
        communityVerified: "bg-sky-100 text-sky-800 ring-1 ring-sky-300",
        communityReported: "bg-accent-100 text-accent-800 ring-1 ring-accent-300",
        community: "bg-accent-100 text-accent-800 ring-1 ring-accent-300",
        outdated: "bg-orange-100 text-orange-800 ring-1 ring-orange-300",
        disputed: "bg-red-100 text-red-800 ring-1 ring-red-300",
        unknown: "bg-stone-100 text-stone-600 ring-1 ring-stone-300",
        info: "bg-sky-100 text-sky-800",
        success: "bg-primary-100 text-primary-800",
        danger: "bg-red-100 text-red-800",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
