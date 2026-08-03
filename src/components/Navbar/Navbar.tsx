"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { BookOpen, Menu, X } from "lucide-react";
import styles from "./Navbar.module.css";
import AuthButton from "../AuthButton/AuthButton";
import ThemeToggle from "../ThemeToggle/ThemeToggle";

export default function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const match = pathname.match(/^\/flipbook\/([^/]+)$/);
  const currentSlug = match ? match[1] : null;

  const editMatch = pathname.match(/^\/flipbook\/([^/]+)\/edit$/);
  const editslug = editMatch ? editMatch[1] : null;

  // A route change should never leave the mobile panel hanging open.
  useEffect(() => setOpen(false), [pathname]);

  const links = [
    { href: "/", label: "Home" },
    { href: "/flipbook/new", label: "New flipbook" },
    ...(currentSlug && currentSlug !== "new"
      ? [{ href: `/flipbook/${currentSlug}/edit`, label: "Edit" }]
      : []),
    ...(editslug ? [{ href: `/flipbook/${editslug}`, label: "View" }] : []),
  ];

  return (
    <header className={styles.nav}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoMark} aria-hidden="true">
            <BookOpen size={15} strokeWidth={2.4} />
          </span>
          <span className={styles.logoText}>Flipbook</span>
        </Link>

        <nav className={styles.links} aria-label="Main">
          {links.map((l) => (
            <Link
              key={l.href + l.label}
              href={l.href}
              data-active={pathname === l.href}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className={styles.right}>
          <ThemeToggle />
          <div className={styles.authDesktop}>
            <AuthButton />
          </div>
          <button
            className={styles.menuButton}
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label="Toggle menu">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className={styles.mobileMenu}>
          {links.map((l) => (
            <Link
              key={l.href + l.label}
              href={l.href}
              data-active={pathname === l.href}
              onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          <div className={styles.mobileAuth}>
            <AuthButton />
          </div>
        </div>
      )}
    </header>
  );
}
