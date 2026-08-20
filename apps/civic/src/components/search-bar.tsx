import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Progressive-enhancement search: a plain GET form to /search that works
 * without JavaScript.
 */
export function SearchBar({
  defaultValue,
  size = "md",
  autoFocus,
  className,
}: {
  defaultValue?: string;
  size?: "md" | "lg";
  autoFocus?: boolean;
  className?: string;
}) {
  return (
    <form action="/search" role="search" className={cn("relative w-full", className)}>
      <label htmlFor="site-search" className="sr-only">
        Search processes, documents, offices and guides
      </label>
      <Search
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-stone-400",
          size === "lg" ? "left-4 size-5" : "left-3 size-4",
        )}
      />
      <input
        id="site-search"
        type="search"
        name="q"
        defaultValue={defaultValue}
        // eslint-disable-next-line jsx-a11y/no-autofocus -- intentional on the search page
        autoFocus={autoFocus}
        placeholder="Search: “How to get TIN”, “rental contract”, “vehicle transfer”…"
        className={cn(
          "w-full rounded-lg border border-stone-300 bg-white text-stone-900 placeholder:text-stone-400 shadow-sm focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-200",
          size === "lg" ? "h-14 pl-11 pr-24 text-base" : "h-10 pl-9 pr-20 text-sm",
        )}
      />
      <button
        type="submit"
        className={cn(
          "absolute top-1/2 -translate-y-1/2 rounded-md bg-primary-700 font-medium text-white hover:bg-primary-800",
          size === "lg" ? "right-2 h-10 px-4 text-sm" : "right-1.5 h-7 px-3 text-xs",
        )}
      >
        Search
      </button>
    </form>
  );
}
