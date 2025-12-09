"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export default function LanguageToggle() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const switchLocale = (next: "pt" | "en") => {
    const current = pathname || "/";
    const params = new URLSearchParams(searchParams?.toString());
    // 1) Set cookie on client (1 year expiration)
    try {
      document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000`;
    } catch {}
    // 2) Remove lang param and preserve others
    if (params.has("lang")) params.delete("lang");
    const qs = params.toString();
    const cleanHref = qs ? `${current}?${qs}` : current;
    const hrefWithBuster = `${cleanHref}${qs ? "&" : "?"}_l=${Date.now()}`;
    // 3) Full reload to ensure Server Component (layout) reads new cookie
    if (typeof window !== "undefined") {
      window.location.replace(hrefWithBuster);
    } else {
      router.replace(hrefWithBuster);
      router.refresh();
    }
  };

  const baseBtn =
    "px-3 py-1 rounded-md border text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60";

  const active = "bg-primary text-slate-900 border-primary";
  const inactive = "bg-transparent text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-foreground";

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Language selector">
      <button
        type="button"
        aria-pressed={locale === "pt" ? "true" : "false"}
        aria-label="Switch to Brazilian Portuguese"
        title="Portuguese (Brazil)"
        className={`${baseBtn} ${locale === "pt" ? active : inactive}`}
        onClick={() => switchLocale("pt")}
      >
        PT-BR
      </button>
      <span aria-hidden className="mx-0.5 text-slate-400">|</span>
      <button
        type="button"
        aria-pressed={locale === "en" ? "true" : "false"}
        aria-label="Switch to English"
        title="English"
        className={`${baseBtn} ${locale === "en" ? active : inactive}`}
        onClick={() => switchLocale("en")}
      >
        EN
      </button>
    </div>
  );
}
