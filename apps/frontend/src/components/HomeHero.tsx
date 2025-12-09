"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

export default function HomeHero() {
  const t = useTranslations();

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800/70 shadow-2xl rounded-3xl min-h-[340px] sm:min-h-[420px] lg:min-h-[500px] flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,59,126,0.35),rgba(2,6,23,0.9))]" />
      <div className="absolute -inset-10 sm:-inset-16 opacity-60 bg-[conic-gradient(at_30%_20%,rgba(34,211,238,0.22),rgba(63,131,248,0.14),rgba(34,211,238,0.22))] blur-3xl" />
      <div className="relative z-10 flex flex-col items-center gap-5 px-6 py-12 text-center max-w-4xl mx-auto">
        <div className="p-4 rounded-full bg-slate-900/70 border border-slate-700/70 shadow-lg shadow-cyan-500/20">
          <Image
            src="/logo.png"
            alt="Stellaro logo"
            width={148}
            height={148}
            priority
            className="w-32 h-32 sm:w-36 sm:h-36 lg:w-40 lg:h-40 object-contain drop-shadow-[0_12px_35px_rgba(96,165,250,0.35)]"
          />
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-50 tracking-tight">
            {t("hero_title")}
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-base sm:text-lg">
            {t("hero_subtitle")}
          </p>
        </div>
      </div>
    </section>
  );
}

