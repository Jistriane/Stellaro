"use client";

import WalletPanel from "../components/WalletPanel";
import TradingView from "../components/TradingView";
import LanguageToggle from "../components/LanguageToggle";
import BalanceChart from "../components/BalanceChart";
import { useLocale, useTranslations } from "next-intl";
import HomeHero from "../components/HomeHero";
export default function Home() {
  const locale = useLocale();
  const t = useTranslations("home");
  const lc: "pt" | "en" = locale === "en" ? "en" : "pt";
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-0 sm:p-0 pb-20 gap-0">
      
      {/* Hero */}
      <HomeHero />

      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start p-6 sm:p-12 w-full">
        <div className="w-full flex justify-end">
          <LanguageToggle />
        </div>
        <WalletPanel />
        <div className="w-full max-w-5xl">
          <TradingView symbols={[["XLM", "USD"]]} height={420} theme="dark" locale={lc} />
        </div>
        <div className="w-full max-w-5xl">
          <BalanceChart />
        </div>
        <ol className="font-mono list-inside list-decimal text-sm/6 text-center sm:text-left">
          <li className="mb-2 tracking-[-.01em]">
            {t("getting_started.edit_file", { file: "src/app/page.tsx" })}
          </li>
          <li className="tracking-[-.01em]">{t("getting_started.save_and_view")}</li>
        </ol>

        
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center text-slate-500">
        <span className="text-xs">{t("footer.brand")}</span>
      </footer>
    </div>
  );
}
