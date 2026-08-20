import Link from "next/link";
import { Fragment } from "react";

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 overflow-x-auto">
      <ol className="flex items-center gap-1.5 text-sm text-stone-500 whitespace-nowrap">
        <li>
          <Link href="/" className="hover:text-primary-700 hover:underline">
            Home
          </Link>
        </li>
        {items.map((item, index) => (
          <Fragment key={index}>
            <li aria-hidden="true" className="text-stone-400">
              /
            </li>
            <li>
              {item.href ? (
                <Link href={item.href} className="hover:text-primary-700 hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" className="text-stone-800">
                  {item.label}
                </span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
