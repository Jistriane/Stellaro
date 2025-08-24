"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

export default function Breadcrumbs() {
  const t = useTranslations("routes");
  const pathname = usePathname();
  // Divide o caminho e remove primeiro segmento se for um locale
  const rawSegments = (pathname || "/").split("/").filter(Boolean);
  const segments = rawSegments[0] === "en" || rawSegments[0] === "pt" ? rawSegments.slice(1) : rawSegments;

  const crumbs = ["/", ...segments.map((_, i) => "/" + segments.slice(0, i + 1).join("/"))];

  function labelFromSegment(seg: string) {
    const key = !seg ? "home" : seg.toLowerCase();
    // Tenta traduzir via next-intl; se não houver chave, faz fallback para capitalização
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
    <nav aria-label="Breadcrumb" className="w-full border-b border-slate-800 bg-slate-950/60 backdrop-blur supports-[backdrop-filter]:bg-slate-950/40">
      <div className="px-6 py-3 flex items-center justify-start gap-4">
        <ol className="flex items-center gap-2 text-sm text-slate-400">
          {crumbs.map((href, idx) => {
            const isLast = idx === crumbs.length - 1;
            const seg = idx === 0 ? "" : segments[idx - 1];
            return (
              <li key={href} className="flex items-center gap-2">
                {idx > 0 && <span className="text-slate-600">/</span>}
                {isLast ? (
                  <span className="text-slate-200 font-medium">{labelFromSegment(seg)}</span>
                ) : (
                  <Link href={href} className="hover:text-slate-200 transition-colors">
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
