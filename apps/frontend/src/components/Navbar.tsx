"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/risk", label: "Risk" },
  ];
  return (
    <header className="w-full sticky top-0 z-50 bg-background/70 backdrop-blur-xl border-b border-border/70">
      <div className="mx-auto max-w-6xl px-4 h-[68px] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Stellaro" width={36} height={36} priority className="h-9 w-9 object-contain" />
          <span className="text-xs uppercase tracking-[0.32em] text-foreground/90">Stellaro</span>
        </Link>
        <nav className="flex items-center gap-3">
          <ul className="hidden md:flex items-center gap-4 mr-2">
            {links.map((l) => {
              const active = pathname?.startsWith(l.href) ?? false;
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className={`text-xs px-3 py-2 rounded-full uppercase tracking-[0.22em] transition-colors ${
                      active
                        ? "text-primary-foreground bg-primary shadow-[0_0_28px_rgba(212,168,106,0.45)]"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
