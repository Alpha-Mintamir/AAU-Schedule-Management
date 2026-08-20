"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="text-2xl font-bold text-stone-900">Something went wrong</h1>
      <p className="mt-2 text-stone-600">
        An unexpected error occurred. Your data is safe — please try again.
      </p>
      {error.digest ? (
        <p className="mt-1 text-xs text-stone-400">Error reference: {error.digest}</p>
      ) : null}
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-md bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800"
      >
        Try again
      </button>
    </div>
  );
}
