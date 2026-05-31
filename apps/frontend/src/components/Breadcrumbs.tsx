"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

export default function Breadcrumbs() {
  const t = useTranslations("routes");
  const pathname = usePathname();
  // Split the path and remove first segment if it's a locale
  const rawSegments = (pathname || "/").split("/").filter(Boolean);
  const segments = rawSegments[0] === "en" || rawSegments[0] === "pt" ? rawSegments.slice(1) : rawSegments;

  const crumbs = ["/", ...segments.map((_, i) => "/" + segments.slice(0, i + 1).join("/"))];

  function labelFromSegment(seg: string) {
    const key = !seg ? "home" : seg.toLowerCase();
    // Try to translate via next-intl; if no key, fallback to capitalization
    try {
      const translated = t(key) as string;
      if (translated) return String(translated);
    } catch {}
    if (!seg) {
      try {
        const home = t("home");
        if (home) return String(home);
      } catch {}
      return "Home";
    }
    return seg
      .split("-")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ");
  }

  return (
    <nav aria-label="Breadcrumb" className="w-full border-b border-border/60 bg-background/50 backdrop-blur-xl supports-[backdrop-filter]:bg-background/30">
      <div className="px-6 py-3 flex items-center justify-start gap-4">
        <ol className="flex items-center gap-2 text-sm text-muted-foreground">
          {crumbs.map((href, idx) => {
            const isLast = idx === crumbs.length - 1;
            const seg = idx === 0 ? "" : segments[idx - 1];
            return (
              <li key={href} className="flex items-center gap-2">
                {idx > 0 && <span className="text-muted-foreground/70">/</span>}
                {isLast ? (
                  <span className="text-foreground font-medium">{labelFromSegment(seg)}</span>
                ) : (
                  <Link href={href} className="hover:text-foreground transition-colors">
                    {idx === 0 ? (t("home") as string) : labelFromSegment(seg)}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
