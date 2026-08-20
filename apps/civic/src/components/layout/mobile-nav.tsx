"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function MobileNav({
  items,
  isSignedIn,
}: {
  items: Array<{ href: string; label: string }>;
  isSignedIn: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
        className="flex size-9 items-center justify-center rounded-md text-stone-700 hover:bg-stone-100"
      >
        {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
      </button>
      {open ? (
        <nav
          id="mobile-menu"
          aria-label="Mobile"
          className="absolute inset-x-0 top-14 z-50 border-b border-stone-200 bg-white shadow-lg"
        >
          <ul className="px-2 py-2">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-md px-3 py-2.5 text-sm text-stone-700 hover:bg-stone-100"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/contribute"
                className="block rounded-md px-3 py-2.5 text-sm font-medium text-primary-800 hover:bg-primary-50"
              >
                Contribute
              </Link>
            </li>
            {!isSignedIn ? (
              <li>
                <Link
                  href="/login"
                  className="block rounded-md px-3 py-2.5 text-sm text-stone-700 hover:bg-stone-100"
                >
                  Sign in
                </Link>
              </li>
            ) : null}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
