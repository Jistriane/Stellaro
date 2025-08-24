"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getContractIds, viewPortfolio, getWalletBalances } from "@/lib/soroban";
import { useTranslations } from "next-intl";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";
import { useEffect, useState } from "react";

export default function PortfolioPage() {
  const t = useTranslations("portfolio");
  const tc = useTranslations("common");
  const [portfolio, setPortfolio] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Ativa atualizações em tempo real quando carteira conecta
  useRealTimeUpdates();
  
  useEffect(() => {
    async function loadData() {
      const ids = getContractIds();
      const [portfolioData, walletData] = await Promise.all([
        viewPortfolio(),
        getWalletBalances(),
      ]);
      setPortfolio(portfolioData);
      setWallet(walletData);
      setLoading(false);
    }
    
    loadData();
  }, []);

  // Conversões mock para estimativas
  const rateSTLT_BRL = 1.0; // 1 STLT ≈ 1 BRL (mock)
  const rateSTLT_USD = 0.2; // mock
  const rateXLM_BRL = 1.75; // mock para exibição
  const rateXLM_USD = 0.35; // mock

  const stlt = Number.parseFloat(wallet?.stlt || "0");
  const xlm = Number.parseFloat(wallet?.xlm || "0");

  const stltBRL = stlt * rateSTLT_BRL;
  const stltUSD = stlt * rateSTLT_USD;
  const xlmBRL = xlm * rateXLM_BRL;
  const xlmUSD = xlm * rateXLM_USD;

  const totalBRL = stltBRL + xlmBRL;
  const totalUSD = stltUSD + xlmUSD;

  const assets = [
    {
      key: "STLT",
      name: "STLT",
      qty: stlt,
      valueBRL: stltBRL,
      valueUSD: stltUSD,
      href: "/stablecoin",
    },
    {
      key: "XLM",
      name: "XLM",
      qty: xlm,
      valueBRL: xlmBRL,
      valueUSD: xlmUSD,
      href: "/wallet",
    },
  ];

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center">
          <div className="text-slate-400">Carregando...</div>
        </div>
      </div>
    );
  }
  
  const ids = getContractIds();

  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("header.title")}</h1>
        <div className="text-xs text-slate-500">{t("header.updated", { when: new Date().toLocaleString() })}</div>
      </div>

      {/* Resumo Global */}
      <Card>
        <CardHeader>
          <CardTitle>{t("summary.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900 rounded p-3">
              <div className="text-xs text-slate-400">{t("summary.total_brl")}</div>
              <div className="text-2xl font-semibold">R$ {totalBRL.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}</div>
              <div className="text-xs text-slate-500">{t("summary.estimate")}</div>
            </div>
            <div className="bg-slate-900 rounded p-3">
              <div className="text-xs text-slate-400">{t("summary.total_usd")}</div>
              <div className="text-2xl font-semibold">$ {totalUSD.toLocaleString("en-US", { maximumFractionDigits: 2 })}</div>
              <div className="text-xs text-slate-500">{t("summary.estimate")}</div>
            </div>
            <div className="bg-slate-900 rounded p-3">
              <div className="text-xs text-slate-400">{t("summary.contract")}</div>
              <div className="truncate text-sm text-slate-200">{ids.PORTFOLIO_CONTRACT_ID || "—"}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Distribuição dos Ativos */}
      <Card>
        <CardHeader>
          <CardTitle>{t("distribution.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-slate-500 mb-2">{t("distribution.composition_label")}</div>
          <div className="space-y-2">
            {assets.map((a) => {
              const pct = totalBRL > 0 ? (a.valueBRL / totalBRL) * 100 : 0;
              return (
                <Link key={a.key} href={a.href} className="block">
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-slate-200">{a.name}</div>
                    <div className="text-slate-400">{pct.toFixed(1)}%</div>
                  </div>
                  <div className="w-full bg-slate-800 rounded h-2 mt-1 overflow-hidden">
                    <div className="bg-primary h-2" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {t("distribution.qty_label", { qty: a.qty.toLocaleString("pt-BR", { maximumFractionDigits: 4 }), brl: a.valueBRL.toLocaleString("pt-BR", { maximumFractionDigits: 2 }), usd: a.valueUSD.toLocaleString("en-US", { maximumFractionDigits: 2 }) })}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Referência do contrato de alocação (mock do protocolo) */}
          <div className="mt-4">
            <div className="text-xs text-slate-500">{t("distribution.protocol_ref_title")}</div>
            <ul className="text-xs grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
              {portfolio.allocation.map((a) => (
                <li key={a.asset} className="flex items-center justify-between bg-slate-900 rounded px-3 py-2">
                  <span className="text-slate-300">{a.asset}</span>
                  <span className="text-slate-200"><b>{(a.pct_bps/100).toFixed(1)}%</b></span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Histórico e Variação (mock) */}
      <Card>
        <CardHeader>
          <CardTitle>{t("history.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-slate-500">{t("history.last30")}</div>
          <div className="mt-2 h-24 w-full rounded bg-[linear-gradient(180deg,rgba(16,185,129,0.25),rgba(16,185,129,0.05))] border border-slate-800" />
          <div className="mt-2 text-sm">{t("history.performance", { value: "+R$ 1.200", pct: "+6,3%" })}</div>
          <div className="mt-1 text-xs text-slate-500">{t("history.note_filters")}</div>
        </CardContent>
      </Card>

      {/* Extrato e Relatórios */}
      <Card>
        <CardHeader>
          <CardTitle>{t("reports.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 text-sm">
            <Link href="/wallet" className="px-3 py-2 rounded bg-slate-800">{t("reports.view_full")}</Link>
            <button disabled className="px-3 py-2 rounded bg-slate-800 text-slate-400 cursor-not-allowed" title={tc("soon")}>{t("reports.download_csv")}</button>
            <button disabled className="px-3 py-2 rounded bg-slate-800 text-slate-400 cursor-not-allowed" title={tc("soon")}>{t("reports.download_pdf")}</button>
          </div>
        </CardContent>
      </Card>

      {/* Avisos Importantes */}
      <Card>
        <CardHeader>
          <CardTitle>{t("notices.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 text-sm space-y-1 text-amber-300">
            <li>{t("notices.n1")}</li>
            <li>{t("notices.n2")}</li>
            <li>{t("notices.n3")}</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
