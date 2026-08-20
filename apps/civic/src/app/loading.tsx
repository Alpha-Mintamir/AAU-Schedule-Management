export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8" role="status" aria-label="Loading">
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-1/3 rounded bg-stone-200" />
        <div className="h-4 w-2/3 rounded bg-stone-200" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-36 rounded-lg bg-stone-200" />
          ))}
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
