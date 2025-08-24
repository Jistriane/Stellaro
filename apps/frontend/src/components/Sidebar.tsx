"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";

const nav = [
  { href: "/login", key: "login" },
  { href: "/dashboard", key: "dashboard" },
  { href: "/wallet", key: "wallet" },
  { href: "/stablecoin", key: "stablecoin" },
  { href: "/loans", key: "loans" },
  { href: "/portfolio", key: "portfolio" },
  { href: "/governance", key: "governance" },
  { href: "/profile", key: "profile" },
  { href: "/pix", key: "pix" },
  { href: "/cards", key: "cards" },
  { href: "/settings", key: "settings" },
  { href: "/help", key: "help" },
  // extras já existentes no projeto
  { href: "/insurance", key: "insurance" },
  { href: "/trading", key: "trading" },
  { href: "/chat", key: "chat" },
  { href: "/risk", key: "risk" },
  { href: "/docs", key: "docs" },
];

export default function Sidebar() {
  const t = useTranslations();
  const pathname = usePathname() || "/";

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-slate-950 text-slate-200 border-r border-slate-800 flex flex-col">
      <div className="h-16 px-4 flex items-center gap-3 border-b border-slate-800">
        <Image src="/logo.png" alt="Stelato" width={56} height={56} className="h-14 w-14" />
        <span className="font-semibold text-xl tracking-tight">Stelato</span>
      </div>
      <nav className="flex-1 overflow-auto py-3">
        <ul className="flex flex-col gap-1 px-2">
          {nav.map((i) => {
            const active = pathname === i.href || pathname.startsWith(i.href + "/");
            const label = (() => {
              try {
                const l = t(`routes.${i.key}`) as unknown;
                return typeof l === "string" && l ? l : i.key;
              } catch {
                return i.key;
              }
            })();
            return (
              <li key={i.href}>
                <Link
                  href={i.href}
                  className={`block px-3 py-2 rounded text-sm transition-colors ${
                    active ? "bg-slate-800 text-white" : "text-slate-300 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-3 text-xs text-slate-500 border-t border-slate-800">v0.1.0</div>
    </aside>
  );
}
