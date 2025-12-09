"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

export default function HomeHero() {
  const t = useTranslations();

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800/70 rounded-3xl min-h-[340px] sm:min-h-[420px] lg:min-h-[500px] flex items-center justify-center">
      <div className="relative z-10 flex flex-col items-center gap-5 px-6 py-12 text-center max-w-4xl mx-auto">
        <Image
          src="/logo.png"
          alt="Stellaro logo"
          width={148}
          height={148}
          priority
          className="w-32 h-32 sm:w-36 sm:h-36 lg:w-40 lg:h-40 object-contain"
        />
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

