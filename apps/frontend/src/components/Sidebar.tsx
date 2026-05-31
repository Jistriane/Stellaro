"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";

const nav = [
  { href: "/", key: "home" },
  { href: "/dashboard", key: "dashboard" },
  { href: "/dashboard/analytics", key: "analytics" },
  { href: "/wallet", key: "wallet" },
  { href: "/portfolio", key: "portfolio" },
  { href: "/stablecoin", key: "stablecoin" },
  { href: "/loans", key: "loans" },
  { href: "/defi/stats", key: "defi" },
  { href: "/liquidity/pools", key: "liquidity" },
  { href: "/transactions/history", key: "transactions" },
  { href: "/bridge", key: "bridge" },
  { href: "/governance", key: "governance" },
  { href: "/dao", key: "dao" },
  { href: "/rwa", key: "rwa" },
  { href: "/ssi", key: "ssi" },
  { href: "/recurring-payments", key: "recurringPayments" },
  { href: "/governance/vote", key: "vote" },
  { href: "/risk", key: "risk" },
  { href: "/risk/analysis", key: "analysis" },
  { href: "/insurance", key: "insurance" },
  { href: "/pix", key: "pix" },
  { href: "/cards", key: "cards" },
  { href: "/notifications", key: "notifications" },
  { href: "/chat", key: "chat" },
  { href: "/help", key: "help" },
  { href: "/docs", key: "docs" },
  { href: "/learn", key: "learn" },
  { href: "/examples", key: "examples" },
  { href: "/profile", key: "profile" },
  { href: "/settings", key: "settings" },
  { href: "/settings/advanced", key: "advanced" },
  { href: "/trading", key: "trading" },
  { href: "/login", key: "login" },
];

export default function Sidebar() {
  const t = useTranslations("routes");
  const pathname = usePathname() || "/";

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 border-r border-border bg-background/80 text-foreground backdrop-blur-xl flex flex-col">
      <div className="h-[68px] px-4 flex items-center gap-3 border-b border-border/70">
        <Image src="/logo.png" alt="Stellaro" width={56} height={56} className="h-14 w-14" />
        <span className="text-sm uppercase tracking-[0.32em] text-foreground/90">Stellaro</span>
      </div>
      <nav className="flex-1 overflow-auto py-3">
        <ul className="flex flex-col gap-1 px-2">
          {nav.map((i) => {
            const active = pathname === i.href || pathname.startsWith(i.href + "/");
            const label = (() => {
              try {
                const l = t(i.key) as unknown;
                return typeof l === "string" && l ? l : i.key;
              } catch {
                return i.key;
              }
            })();
            return (
              <li key={i.href}>
                <Link
                  href={i.href}
                  className={`block px-3 py-2 rounded-xl text-sm transition-colors ${
                    active
                      ? "bg-secondary/70 text-foreground border border-primary/15"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                  }`}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-3 text-[10px] text-muted-foreground border-t border-border/70 font-mono uppercase tracking-[0.12em]">
        v0.1.0
      </div>
    </aside>
  );
}
