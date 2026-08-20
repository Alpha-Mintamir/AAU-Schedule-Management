"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./admin.module.css";

const links = [
  { href: "/admin", label: "Structure", match: (path: string) => path === "/admin" },
  {
    href: "/admin/courses",
    label: "Courses",
    match: (path: string) => path.startsWith("/admin/courses"),
  },
];

export function AdminShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.brand}>
          <span className={styles.mark} aria-hidden />
          AAU Schedule
        </Link>

        <nav className={styles.nav} aria-label="Admin">
          {links.map((link) => {
            const active = link.match(pathname);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFoot}>
          <p>Need the public overview? Head back to the home page.</p>
          <Link href="/">View site</Link>
        </div>
      </aside>

      <div className={styles.main}>
        <div className={styles.topbar}>
          <div>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <span className={styles.badge}>Admin</span>
        </div>
        {children}
      </div>
    </div>
  );
}
