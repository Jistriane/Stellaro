"use client";

import Link from "next/link";
import WalletPanel from "../components/WalletPanel";
import TradingView from "../components/TradingView";
import BalanceChart from "../components/BalanceChart";
import { useLocale, useTranslations } from "next-intl";
import HomeHero from "../components/HomeHero";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
export default function Home() {
  const locale = useLocale();
  const t = useTranslations("home");
  const lc: "pt" | "en" = locale === "en" ? "en" : "pt";
  return (
    <div className="font-sans flex flex-col gap-10 min-h-screen w-full">
      <div className="w-full max-w-6xl mx-auto">
        <HomeHero />
      </div>

      <main className="flex flex-col gap-8 items-center w-full max-w-6xl mx-auto">
        <WalletPanel />

        <Card className="w-full border-slate-700/60 bg-slate-950/50 backdrop-blur shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-slate-100">Real-time Market</CardTitle>
          </CardHeader>
          <CardContent>
            <TradingView symbols={[["XLM", "USD"], ["BTC", "USD"]]} height={480} theme="dark" locale={lc} />
          </CardContent>
        </Card>

        <div className="w-full">
          <BalanceChart />
        </div>

        <Card className="w-full border-emerald-400/20 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 backdrop-blur shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-slate-100">Stellaro v4.0 Launchpad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-300 max-w-3xl">
              A próxima camada do projeto conecta tokenização de RWA, verifiable credentials, pagamentos recorrentes e governança DAO em uma superfície única de produto.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { href: "/v4", title: "Visão geral v4", text: "Mapa dos módulos novos e estado de implementação." },
                { href: "/rwa", title: "RWA", text: "Tokenização, whitelist e documentação legal." },
                { href: "/ssi", title: "SSI / VCs", text: "Wallet de credenciais e fluxos de apresentação." },
                { href: "/recurring-payments", title: "Pagamentos recorrentes", text: "Assinaturas em stablecoin com trilha de auditoria." },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 transition-all hover:border-emerald-400/40 hover:bg-slate-900"
                >
                  <div className="text-sm font-medium text-slate-100">{item.title}</div>
                  <div className="mt-2 text-xs leading-5 text-slate-400">{item.text}</div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
      <footer className="flex gap-6 flex-wrap items-center justify-center text-slate-500 py-6">
        <span className="text-xs">{t("footer.brand")}</span>
      </footer>
    </div>
  );
}
