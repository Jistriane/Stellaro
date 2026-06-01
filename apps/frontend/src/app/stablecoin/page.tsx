"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getContractIds, viewStablecoin, getWalletBalances, getHorizonBaseUrl } from "@/lib/soroban";
import { useTranslations } from "next-intl";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";
import { useEffect, useState } from "react";
import { useWalletStore } from "@/state/wallet";

export default function StablecoinPage() {
  const t = useTranslations("stablecoin");
  const [info, setInfo] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [movements, setMovements] = useState<
    Array<{ date: string; type: string; asset: string; amount: string; status: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const address = useWalletStore((s) => s.address);
  
  // Enable real-time updates when the wallet connects
  useRealTimeUpdates();
  
  useEffect(() => {
    async function loadData() {
      try {
        const [infoData, walletData] = await Promise.all([
          viewStablecoin(),
          getWalletBalances(address ?? undefined),
        ]);
        setInfo(infoData);
        setWallet(walletData);

        if (address) {
          const horizon = getHorizonBaseUrl();
          const res = await fetch(
            `${horizon}/accounts/${encodeURIComponent(address)}/payments?order=desc&limit=10`,
            { cache: "no-store" },
          );
          if (res.ok) {
            const json = (await res.json()) as {
              _embedded?: { records?: any[] };
            };
            const records = json?._embedded?.records ?? [];
            const issuer = getContractIds().STELLAR_PUBLIC_KEY;
            const filtered = records
              .filter((r) => r?.asset_code === "STLT")
              .filter((r) => (issuer ? r?.asset_issuer === issuer : true))
              .map((r) => ({
                date: String(r?.created_at ?? "").slice(0, 10),
                type: String(r?.type ?? "payment"),
                asset: issuer ? `STLT:${issuer.slice(0, 6)}…` : "STLT",
                amount: String(r?.amount ?? ""),
                status: "OK",
              }));
            setMovements(filtered);
          } else {
            setMovements([]);
          }
        } else {
          setMovements([]);
        }
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [address]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  const stlt = Number.parseFloat(wallet?.stlt || "0");
  const ids = getContractIds();

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
            <div className="text-2xl font-semibold">
              {stlt.toLocaleString("en-US", { maximumFractionDigits: 7 })} STLT
            </div>
            <div className="text-xs text-muted-foreground">
              {address ? t("balances.common.balance", { amount: stlt.toLocaleString("en-US", { maximumFractionDigits: 7 }) }) : t("actions.note_mvp")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("status.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {typeof info?.supply === "number" ? info.supply.toLocaleString("en-US", { maximumFractionDigits: 7 }) : "—"}
            </div>
            <div className="text-xs text-muted-foreground">{t("status.last_update")}: {info?.timestamp ? new Date(info.timestamp).toLocaleString() : "—"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("contract.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">{t("contract.id")}</div>
            <div className="truncate mb-2 text-foreground">{info?.contractId || ids.STABLECOIN_CONTRACT_ID || "—"}</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div>{t("contract.symbol")}: <b>{info?.symbol || "STLT"}</b></div>
              <div>{t("contract.asset")}: <b>{info?.asset || "STLT"}</b></div>
              <div>{t("contract.status")}: <b>{t("contract.status_active")}</b></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t("actions.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled className="px-3 py-2 rounded bg-secondary/20 border border-border/60 text-muted-foreground text-sm cursor-not-allowed">{t("actions.mint")}</button>
            <button type="button" disabled className="px-3 py-2 rounded bg-secondary/20 border border-border/60 text-muted-foreground text-sm cursor-not-allowed">{t("actions.burn")}</button>
            <button type="button" disabled className="px-3 py-2 rounded bg-secondary/20 border border-border/60 text-muted-foreground text-sm cursor-not-allowed">{t("actions.send")}</button>
            <button type="button" disabled className="px-3 py-2 rounded bg-secondary/20 border border-border/60 text-muted-foreground text-sm cursor-not-allowed">{t("actions.receive")}</button>
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
          {movements.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              {address ? t("pix.history.empty") : t("wallet.login_to_view")}
            </div>
          ) : null}
          <ul className="text-sm space-y-2">
            {movements.map((m) => (
              <li key={`${m.date}-${m.type}-${m.amount}`} className="flex items-center justify-between rounded border border-border/60 bg-card/50 px-3 py-2">
                <div>
                  <div className="text-foreground">{`${m.date} • ${m.type} • ${m.amount.toLocaleString("en-US")} ${m.asset}`}</div>
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
            <div>{t("status.contract")}: <b>{info?.contractId || ids.STABLECOIN_CONTRACT_ID || "—"}</b></div>
            <div>{t("status.last_update")}: <b>{info?.timestamp ? new Date(info.timestamp).toLocaleString() : "—"}</b></div>
            <div>Decimals: <b>{info?.decimals ?? "—"}</b></div>
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
