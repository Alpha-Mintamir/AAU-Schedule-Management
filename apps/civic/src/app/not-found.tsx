import Link from "next/link";
import { SearchBar } from "@/components/search-bar";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <p className="text-sm font-semibold text-primary-700 uppercase">404</p>
      <h1 className="mt-1 text-2xl font-bold text-stone-900">This page doesn&apos;t exist</h1>
      <p className="mt-2 text-stone-600">
        The page may have moved or the address may be wrong. Try searching for what you need:
      </p>
      <div className="mt-6">
        <SearchBar />
      </div>
      <Link href="/" className="mt-6 inline-block text-sm font-medium text-primary-700 hover:underline">
        ← Back to the homepage
      </Link>
    </div>
  );
}
