"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

export default function HomeHero() {
  const t = useTranslations();

  return (
    <div className="space-y-6">
      <section className="relative isolate w-full overflow-hidden rounded-3xl border border-primary/10 bg-card/60 min-h-[170px] aspect-[5/2] sm:min-h-[240px] lg:min-h-[320px] backdrop-blur-xl shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
        <Image
          src="/capa.png"
          alt="Stellaro cover"
          fill
          priority
          sizes="100vw"
          className="object-contain object-center"
        />
      </section>

      <div className="rounded-2xl border border-primary/10 bg-card/60 px-5 py-5 backdrop-blur-xl sm:px-6 sm:py-6">
        <div className="max-w-2xl space-y-4 text-left sm:space-y-5">
          <div className="inline-flex items-center gap-3 rounded-full border border-border/70 bg-background/30 px-4 py-2 backdrop-blur">
            <Image
              src="/logo.png"
              alt="Stellaro logo"
              width={56}
              height={56}
              className="h-10 w-10 rounded-md object-contain"
            />
            <span className="text-xs uppercase tracking-[0.32em] text-muted-foreground">Stellaro</span>
          </div>
          <div className="space-y-2">
            <h1 className="max-w-xl text-2xl font-light tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {t("hero_title")}
            </h1>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7 lg:text-lg">
              {t("hero_subtitle")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
