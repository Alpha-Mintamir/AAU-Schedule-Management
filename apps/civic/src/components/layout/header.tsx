import Link from "next/link";
import { Landmark } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { getCurrentUser } from "@/lib/auth/session";
import { canModerate, hasPermission, ROLE_LABELS } from "@/lib/auth/permissions";
import { MobileNav } from "./mobile-nav";

const NAV_ITEMS = [
  { href: "/processes", label: "Processes" },
  { href: "/documents", label: "Documents" },
  { href: "/offices", label: "Offices" },
  { href: "/pages", label: "Guides" },
  { href: "/locations", label: "Locations" },
];

export async function Header() {
  const user = await getCurrentUser();
  const showModeration = canModerate(user?.role);
  const showAdmin = hasPermission(user?.role, "admin:access_dashboard");

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold text-primary-800">
          <Landmark aria-hidden="true" className="size-5" />
          <span className="text-base">
            Menged <span className="font-normal text-stone-500">· መንገድ</span>
          </span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-2.5 py-1.5 text-sm text-stone-600 hover:bg-stone-100 hover:text-stone-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/search"
            className="hidden rounded-md px-2.5 py-1.5 text-sm text-stone-600 hover:bg-stone-100 sm:block"
          >
            Search
          </Link>
          <Link
            href="/contribute"
            className="hidden rounded-md bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-800 hover:bg-primary-100 sm:block"
          >
            Contribute
          </Link>
          {user ? (
            <details className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md px-2 py-1.5 text-sm text-stone-700 hover:bg-stone-100 [&::-webkit-details-marker]:hidden">
                <span
                  aria-hidden="true"
                  className="flex size-7 items-center justify-center rounded-full bg-primary-700 text-xs font-semibold text-white"
                >
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="hidden max-w-28 truncate lg:block">{user.name}</span>
              </summary>
              <div className="absolute right-0 z-50 mt-1 w-56 rounded-md border border-stone-200 bg-white py-1 shadow-lg">
                <div className="border-b border-stone-100 px-3 py-2">
                  <p className="truncate text-sm font-medium text-stone-900">{user.name}</p>
                  <p className="text-xs text-stone-500">{ROLE_LABELS[user.role]}</p>
                </div>
                <Link href="/account" className="block px-3 py-2 text-sm text-stone-700 hover:bg-stone-50">
                  My contributions
                </Link>
                {showModeration ? (
                  <Link
                    href="/moderation"
                    className="block px-3 py-2 text-sm text-stone-700 hover:bg-stone-50"
                  >
                    Moderation queue
                  </Link>
                ) : null}
                {showAdmin ? (
                  <Link href="/admin" className="block px-3 py-2 text-sm text-stone-700 hover:bg-stone-50">
                    Admin dashboard
                  </Link>
                ) : null}
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="block w-full px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-50"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            </details>
          ) : (
            <Link
              href="/login"
              className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-100"
            >
              Sign in
            </Link>
          )}
          <MobileNav items={NAV_ITEMS} isSignedIn={user !== null} />
        </div>
      </div>
    </header>
  );
}
