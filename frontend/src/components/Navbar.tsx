"use client";

import Link from "next/link";

const links = [
  { href: "/#about", label: "About" },
  { href: "/#chat", label: "Ask AI" },
  { href: "/#experience", label: "Experience" },
  { href: "/#projects", label: "Projects" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-3 text-paper">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-signal-gold">
            <span className="text-sm font-bold leading-none text-paper">S</span>
          </span>
          <span className="text-sm font-medium tracking-[0.18em] uppercase">
            V Saketh 
          </span>
        </Link>
        <div className="hidden gap-8 sm:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[11px] font-medium uppercase tracking-[0.22em] text-paper/80 transition-colors hover:text-paper"
            >
              {link.label}
            </a>
          ))}
        </div>
      </nav>
    </header>
  );
}
