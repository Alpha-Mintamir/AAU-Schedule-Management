import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed border-stone-300 bg-white px-6 py-10 text-center",
        className,
      )}
    >
      <p className="text-base font-medium text-stone-800">{title}</p>
      {description ? <p className="mx-auto mt-1 max-w-md text-sm text-stone-500">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
