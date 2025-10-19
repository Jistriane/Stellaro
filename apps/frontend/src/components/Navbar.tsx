"use client";

import Image from "next/image";
import Link from "next/link";
import LanguageToggle from "@/components/LanguageToggle";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/risk", label: "Risk" },
  ];
  return (
    <header className="w-full sticky top-0 z-50 backdrop-blur bg-slate-900/70 border-b border-slate-800">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Stellaro" width={36} height={36} className="h-9 w-9 object-contain" />
          <span className="font-semibold text-slate-100">Stellaro</span>
        </Link>
        <nav className="flex items-center gap-3">
          <ul className="hidden md:flex items-center gap-4 mr-2">
            {links.map((l) => {
              const active = pathname?.startsWith(l.href) ?? false;
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className={`text-sm px-2 py-1 rounded transition-colors ${
                      active
                        ? "text-slate-900 bg-primary"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <LanguageToggle />
        </nav>
      </div>
    </header>
  );
}

