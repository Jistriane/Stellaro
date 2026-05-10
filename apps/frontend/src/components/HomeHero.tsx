"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

export default function HomeHero() {
  const t = useTranslations();

  return (
    <section className="relative isolate w-full overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-950 min-h-[420px] sm:min-h-[520px] lg:min-h-[640px] shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
      <Image
        src="/capa.png"
        alt="Stellaro cover"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center opacity-70"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/82 to-slate-950/38" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(96,165,250,0.18),transparent_28%),radial-gradient(circle_at_78%_82%,rgba(251,191,36,0.10),transparent_24%)]" />
      <div className="relative z-10 grid min-h-[420px] sm:min-h-[520px] lg:min-h-[640px] items-center gap-10 px-6 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-12">
        <div className="max-w-2xl space-y-6 text-left">
          <div className="inline-flex items-center gap-3 rounded-full border border-slate-700/80 bg-slate-950/55 px-4 py-2 backdrop-blur-sm">
            <Image
              src="/logo.png"
              alt="Stellaro logo"
              width={56}
              height={56}
              className="h-10 w-10 rounded-md object-contain"
            />
            <span className="text-sm uppercase tracking-[0.32em] text-slate-300">Stellaro</span>
          </div>
          <div className="space-y-3">
            <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-slate-50 sm:text-5xl lg:text-6xl">
              {t("hero_title")}
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-200/90 sm:text-lg">
              {t("hero_subtitle")}
            </p>
          </div>
        </div>

        <div className="justify-self-start lg:justify-self-end w-full max-w-md rounded-3xl border border-white/10 bg-slate-950/45 p-6 text-left shadow-2xl backdrop-blur-md">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Logo e capa</p>
          <p className="mt-4 text-2xl font-medium leading-tight text-slate-50 sm:text-3xl">
            Marca integrada com fundo espacial e hierarquia mais forte.
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            O projeto agora usa a logo no topo e a capa como imagem principal da home.
          </p>
        </div>
      </div>
    </section>
  );
}

