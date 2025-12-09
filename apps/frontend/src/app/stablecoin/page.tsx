"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getContractIds, viewStablecoin, getWalletBalances } from "@/lib/soroban";
import { useTranslations } from "next-intl";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";
import { useEffect, useState } from "react";

export default function StablecoinPage() {
  const t = useTranslations("stablecoin");
  const tc = useTranslations("common");
  const [info, setInfo] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Enable real-time updates when the wallet connects
  useRealTimeUpdates();
  
  useEffect(() => {
    async function loadData() {
      const ids = getContractIds();
      const [infoData, walletData] = await Promise.all([
        viewStablecoin(),
        getWalletBalances(),
      ]);
      setInfo(infoData);
      setWallet(walletData);
      setLoading(false);
    }
    
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center">
          <div className="text-slate-400">Loading...</div>
        </div>
      </div>
    );
  }

  // Balances (mock): use the user's STLT balance and show equivalents
  const stlt = Number.parseFloat(wallet?.stlt || "0");
  const rateBRL = 1.0; // 1 STLT ≈ 1 BRL (mock)
  const rateUSD = 0.2; // mock
  const ids = getContractIds();
  const stltBRL = stlt * rateBRL;
  const stltUSD = stlt * rateUSD;

  // Transaction history (mock)
  const movements = [
    { date: "2025-08-13", type: "Mint", asset: "STLT-BRL", amount: 3500, status: "OK" },
    { date: "2025-08-10", type: "Transfer", asset: "STLT-USD", amount: 2000, status: "OK" },
    { date: "2025-08-03", type: "Burn", asset: "STLT-BRL", amount: 500, status: "OK" },
  ];

  const explorerUrl = ids.STABLECOIN_CONTRACT_ID
    ? `https://stellar.expert/explorer/public/asset/${encodeURIComponent(info.symbol)}-${encodeURIComponent(ids.STELLAR_PUBLIC_KEY || "G...")}`
    : undefined;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("header.title")}</h1>
        <div className="text-xs text-slate-500">{t("header.updated", { when: new Date().toLocaleString() })}</div>
      </div>

      {/* Balances */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("balances.brl.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{t("balances.brl.value", { value: `R$ ${stltBRL.toLocaleString("en-US", { maximumFractionDigits: 2 })}` })}</div>
            <div className="text-xs text-slate-500">{t("balances.common.balance", { amount: stlt.toLocaleString("en-US", { maximumFractionDigits: 4 }) })}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("balances.usd.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{t("balances.usd.value", { value: `$ ${stltUSD.toLocaleString("en-US", { maximumFractionDigits: 2 })}` })}</div>
            <div className="text-xs text-slate-500">{t("balances.usd.note_mock")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("contract.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-slate-500">{t("contract.id")}</div>
            <div className="truncate mb-2 text-slate-200">{ids.STABLECOIN_CONTRACT_ID || "—"}</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div>{t("contract.symbol")}: <b>{info.symbol}</b></div>
              <div>{t("contract.asset")}: <b>{info.asset}</b></div>
              <div>{t("contract.status")}: <b>{info.paused ? t("contract.status_paused") : t("contract.status_active")}</b></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available actions (mock) */}
      <Card>
        <CardHeader>
          <CardTitle>{t("actions.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <button disabled className="px-3 py-2 rounded bg-slate-800 text-slate-400 text-sm cursor-not-allowed" title={tc("soon")}>{t("actions.mint")}</button>
            <button disabled className="px-3 py-2 rounded bg-slate-800 text-slate-400 text-sm cursor-not-allowed" title={tc("soon")}>{t("actions.burn")}</button>
            <button disabled className="px-3 py-2 rounded bg-slate-800 text-slate-400 text-sm cursor-not-allowed" title={tc("soon")}>{t("actions.send")}</button>
            <button disabled className="px-3 py-2 rounded bg-slate-800 text-slate-400 text-sm cursor-not-allowed" title={tc("soon")}>{t("actions.receive")}</button>
          </div>
          <div className="text-xs text-slate-500 mt-2">{t("actions.note_mvp")}</div>
        </CardContent>
      </Card>

      {/* Recent movements */}
      <Card>
        <CardHeader>
          <CardTitle>{t("movements.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm space-y-2">
            {movements.map((m) => (
              <li key={`${m.date}-${m.type}-${m.amount}`} className="flex items-center justify-between bg-slate-900 rounded px-3 py-2">
                <div>
                  <div className="text-slate-200">{t("movements.item_line", { date: m.date, type: m.type, amount: m.amount.toLocaleString("en-US"), asset: m.asset })}</div>
                  <div className="text-xs text-slate-500">{t("movements.status", { status: m.status })}</div>
                </div>
                <Link href="/wallet" className="text-xs underline text-slate-300">{t("movements.view_wallet")}</Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Educational info */}
      <Card>
        <CardHeader>
          <CardTitle>{t("edu.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-300">{t("edu.p1")}</p>
          <ul className="text-sm text-slate-400 mt-2 list-disc pl-5 space-y-1">
            <li>{t("edu.li1")}</li>
            <li>{t("edu.li2")}</li>
            <li>{t("edu.li3")}</li>
          </ul>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <Link href="/docs" className="px-3 py-2 rounded bg-slate-800">{t("edu.docs")}</Link>
            {explorerUrl ? (
              <a href={explorerUrl} target="_blank" rel="noreferrer" className="px-3 py-2 rounded bg-slate-800">{t("edu.view_explorer")}</a>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Fees and policies */}
      <Card>
        <CardHeader>
          <CardTitle>{t("fees.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div>{t("fees.mint_burn")}: <b>0%</b></div>
            <div>{t("fees.transfer")}: <b>0.1%</b></div>
            <div>{t("fees.limits")}: <b>{t("fees.limits_value")}</b></div>
          </div>
          <div className="text-xs text-slate-500 mt-2">{t("fees.note_governance")}</div>
        </CardContent>
      </Card>

      {/* Network and provider status */}
      <Card>
        <CardHeader>
          <CardTitle>{t("status.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div>{t("status.contract")}: <b>{ids.STABLECOIN_CONTRACT_ID || "—"}</b></div>
            <div>{t("status.supply_mock")}: <b>{info.supply}</b></div>
            <div>{t("status.last_update")}: <b>{t("status.now")}</b></div>
          </div>
          <div className="text-xs text-slate-500 mt-2">{t("status.note_explorer")}</div>
        </CardContent>
      </Card>

      {/* Help */}
      <div className="flex items-center justify-between">
        <Link href="/help" className="text-sm underline text-slate-300">{t("help.need_help")}</Link>
        <div className="text-xs text-amber-400">{t("help.warning")}</div>
      </div>
    </div>
  );
}
