"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

export default function HomeHero() {
  const t = useTranslations();

  return (
    <section
      className="row-start-1 col-span-full w-full min-h-[42vh] sm:min-h-[52vh] bg-center bg-cover flex items-center justify-center relative"
      style={{ backgroundImage: 'url(/brand-bg.png)' }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(15,23,42,0.85),rgba(2,6,23,0.95))]" />
      <div className="relative z-10 flex flex-col items-center gap-4 p-8 text-center">
        <Image src="/logo.png" alt="Stelato logo" width={120} height={120} priority className="w-28 h-28 sm:w-36 sm:h-36 object-contain" />
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-100">
          {t("hero_title")}
        </h1>
        <p className="text-slate-300 max-w-xl">
          {t("hero_subtitle")}
        </p>
      </div>
    </section>
  );
}

