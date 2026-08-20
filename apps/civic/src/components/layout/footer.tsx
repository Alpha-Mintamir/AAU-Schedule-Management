import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-stone-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-semibold text-primary-800">Menged · መንገድ</p>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-stone-500">
            A community-maintained guide to Ethiopian public services and administrative
            processes. Official information is always cited; community experience is always
            labeled.
          </p>
        </div>
        <nav aria-label="Explore">
          <p className="text-sm font-semibold text-stone-900">Explore</p>
          <ul className="mt-2 space-y-1.5 text-sm text-stone-600">
            <li><Link className="hover:text-primary-700 hover:underline" href="/processes">Processes</Link></li>
            <li><Link className="hover:text-primary-700 hover:underline" href="/documents">Documents &amp; templates</Link></li>
            <li><Link className="hover:text-primary-700 hover:underline" href="/offices">Government offices</Link></li>
            <li><Link className="hover:text-primary-700 hover:underline" href="/pages">Knowledge guides</Link></li>
            <li><Link className="hover:text-primary-700 hover:underline" href="/locations">Browse by location</Link></li>
          </ul>
        </nav>
        <nav aria-label="Participate">
          <p className="text-sm font-semibold text-stone-900">Participate</p>
          <ul className="mt-2 space-y-1.5 text-sm text-stone-600">
            <li><Link className="hover:text-primary-700 hover:underline" href="/contribute">How to contribute</Link></li>
            <li><Link className="hover:text-primary-700 hover:underline" href="/contribute/new-page">Suggest a new guide</Link></li>
            <li><Link className="hover:text-primary-700 hover:underline" href="/contribute/document">Share a document</Link></li>
            <li><Link className="hover:text-primary-700 hover:underline" href="/register">Create an account</Link></li>
          </ul>
        </nav>
        <div>
          <p className="text-sm font-semibold text-stone-900">About the information here</p>
          <p className="mt-2 text-sm leading-relaxed text-stone-500">
            Menged is not a government website. Content marked{" "}
            <span className="font-semibold text-primary-800">Official</span> is sourced from
            government publications; everything else reflects community experience and may be
            incomplete or outdated. Always confirm critical requirements with the relevant
            office.
          </p>
        </div>
      </div>
      <div className="border-t border-stone-100 py-4 text-center text-xs text-stone-400">
        Built as open civic infrastructure for Ethiopia.
      </div>
    </footer>
  );
}
