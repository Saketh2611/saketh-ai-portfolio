"use client";

import Link from "next/link";

const links = [
  { href: "#about", label: "About" },
  { href: "#chat", label: "Ask AI" },
  { href: "#projects", label: "Projects" },
  { href: "#experience", label: "Experience" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-border bg-ink/85 backdrop-blur">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-mono text-sm font-medium tracking-tight text-paper">
          saketh<span className="text-signal-gold">.ai</span>
        </Link>
        <div className="hidden gap-8 sm:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="font-mono text-xs uppercase tracking-wider text-paper-muted transition-colors hover:text-paper"
            >
              {link.label}
            </a>
          ))}
        </div>
      </nav>
    </header>
  );
}
