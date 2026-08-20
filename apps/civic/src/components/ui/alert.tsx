import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const alertVariants = cva("rounded-md border px-4 py-3 text-sm", {
  variants: {
    variant: {
      info: "border-sky-200 bg-sky-50 text-sky-900",
      success: "border-primary-200 bg-primary-50 text-primary-900",
      warning: "border-accent-200 bg-accent-50 text-accent-900",
      error: "border-red-200 bg-red-50 text-red-900",
    },
  },
  defaultVariants: { variant: "info" },
});

export interface AlertProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

export function Alert({ className, variant, ...props }: AlertProps) {
  return <div role="status" className={cn(alertVariants({ variant }), className)} {...props} />;
}
