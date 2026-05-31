"use client";

import Image from "next/image";
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
          <div className="text-muted-foreground">Loading...</div>
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
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <Image src="/capa.png" alt="Stellaro background" fill priority sizes="100vw" className="object-cover object-center opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/85 to-background/60" />
      <div className="absolute inset-0 bg-[radial-gradient(1000px_circle_at_20%_15%,rgba(var(--stellaro-accent-rgb),0.14),transparent_60%),radial-gradient(900px_circle_at_80%_10%,rgba(197,135,230,0.10),transparent_55%)]" />
      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-8 p-6">
      {/* Header */}
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("header.title")}</h1>
        <div className="text-xs text-muted-foreground">{t("header.updated", { when: new Date().toLocaleString() })}</div>
      </div>

      {/* Balances */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("balances.brl.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{t("balances.brl.value", { value: `R$ ${stltBRL.toLocaleString("en-US", { maximumFractionDigits: 2 })}` })}</div>
            <div className="text-xs text-muted-foreground">{t("balances.common.balance", { amount: stlt.toLocaleString("en-US", { maximumFractionDigits: 4 }) })}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("balances.usd.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{t("balances.usd.value", { value: `$ ${stltUSD.toLocaleString("en-US", { maximumFractionDigits: 2 })}` })}</div>
            <div className="text-xs text-muted-foreground">{t("balances.usd.note_mock")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("contract.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">{t("contract.id")}</div>
            <div className="truncate mb-2 text-foreground">{ids.STABLECOIN_CONTRACT_ID || "—"}</div>
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
            <button disabled className="px-3 py-2 rounded bg-secondary/20 border border-border/60 text-muted-foreground text-sm cursor-not-allowed" title={tc("soon")}>{t("actions.mint")}</button>
            <button disabled className="px-3 py-2 rounded bg-secondary/20 border border-border/60 text-muted-foreground text-sm cursor-not-allowed" title={tc("soon")}>{t("actions.burn")}</button>
            <button disabled className="px-3 py-2 rounded bg-secondary/20 border border-border/60 text-muted-foreground text-sm cursor-not-allowed" title={tc("soon")}>{t("actions.send")}</button>
            <button disabled className="px-3 py-2 rounded bg-secondary/20 border border-border/60 text-muted-foreground text-sm cursor-not-allowed" title={tc("soon")}>{t("actions.receive")}</button>
          </div>
          <div className="text-xs text-muted-foreground mt-2">{t("actions.note_mvp")}</div>
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
              <li key={`${m.date}-${m.type}-${m.amount}`} className="flex items-center justify-between rounded border border-border/60 bg-card/50 px-3 py-2">
                <div>
                  <div className="text-foreground">{t("movements.item_line", { date: m.date, type: m.type, amount: m.amount.toLocaleString("en-US"), asset: m.asset })}</div>
                  <div className="text-xs text-muted-foreground">{t("movements.status", { status: m.status })}</div>
                </div>
                <Link href="/wallet" className="text-xs underline text-primary">{t("movements.view_wallet")}</Link>
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
          <p className="text-sm text-muted-foreground">{t("edu.p1")}</p>
          <ul className="text-sm text-muted-foreground mt-2 list-disc pl-5 space-y-1">
            <li>{t("edu.li1")}</li>
            <li>{t("edu.li2")}</li>
            <li>{t("edu.li3")}</li>
          </ul>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <Link href="/docs" className="px-3 py-2 rounded bg-secondary/30 border border-border/60">{t("edu.docs")}</Link>
            {explorerUrl ? (
              <a href={explorerUrl} target="_blank" rel="noreferrer" className="px-3 py-2 rounded bg-secondary/30 border border-border/60">{t("edu.view_explorer")}</a>
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
          <div className="text-xs text-muted-foreground mt-2">{t("fees.note_governance")}</div>
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
          <div className="text-xs text-muted-foreground mt-2">{t("status.note_explorer")}</div>
        </CardContent>
      </Card>

      {/* Help */}
      <div className="flex items-center justify-between">
        <Link href="/help" className="text-sm underline text-primary">{t("help.need_help")}</Link>
        <div className="text-xs text-primary">{t("help.warning")}</div>
      </div>
      </div>
    </div>
  );
}
