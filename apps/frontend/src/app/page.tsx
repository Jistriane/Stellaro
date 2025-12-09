"use client";

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
      </main>
      <footer className="flex gap-6 flex-wrap items-center justify-center text-slate-500 py-6">
        <span className="text-xs">{t("footer.brand")}</span>
      </footer>
    </div>
  );
}
