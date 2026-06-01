"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getWalletBalances } from "@/lib/soroban";
import { useTranslations } from "next-intl";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";
import { useEffect, useState } from "react";
import { useWalletStore } from "@/state/wallet";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function PortfolioPage() {
  const t = useTranslations("portfolio");
  const [wallet, setWallet] = useState<any>(null);
  const [positions, setPositions] = useState<
    Array<{ asset: string; balance: string; valueUSD: number; apy?: number }>
  >([]);
  const [totalUSD, setTotalUSD] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const address = useWalletStore((s) => s.address);
  
  // Enable real-time updates when the wallet connects
  useRealTimeUpdates();
  
  useEffect(() => {
    async function loadData() {
      try {
        const walletData = await getWalletBalances(address ?? undefined);
        setWallet(walletData);

        if (address) {
          const res = await fetch(
            `${apiUrl}/defi/blend/positions/${encodeURIComponent(address)}?quote=USD`,
            { cache: "no-store" },
          );
          if (res.ok) {
            const body = (await res.json()) as {
              positions: Array<{ asset: string; balance: string; valueUSD: number; apy?: number }>;
              totalUSD: number;
            };
            setPositions(Array.isArray(body.positions) ? body.positions : []);
            setTotalUSD(typeof body.totalUSD === "number" ? body.totalUSD : 0);
          } else {
            setPositions([]);
            setTotalUSD(0);
          }
        } else {
          setPositions([]);
          setTotalUSD(0);
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
  
  const assets = positions.map((p) => ({
    key: p.asset,
    name: p.asset,
    qty: Number(p.balance || 0),
    valueUSD: Number(p.valueUSD || 0),
    href: p.asset === "STLT" ? "/stablecoin" : "/wallet",
  }));
  const totalValueUSD = totalUSD || assets.reduce((sum, a) => sum + (a.valueUSD || 0), 0);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <Image src="/capa.png" alt="Stellaro background" fill priority sizes="100vw" className="object-cover object-center opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/85 to-background/60" />
      <div className="absolute inset-0 bg-[radial-gradient(1000px_circle_at_20%_15%,rgba(var(--stellaro-accent-rgb),0.14),transparent_60%),radial-gradient(900px_circle_at_80%_10%,rgba(197,135,230,0.10),transparent_55%)]" />
      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("header.title")}</h1>
        <div className="text-xs text-muted-foreground">{t("header.updated", { when: new Date().toLocaleString() })}</div>
      </div>

      {/* Resumo Global */}
      <Card>
        <CardHeader>
          <CardTitle>{t("summary.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-card/50 border border-border/60 rounded p-3">
              <div className="text-xs text-muted-foreground">{t("summary.total_usd")}</div>
              <div className="text-2xl font-semibold">$ {totalValueUSD.toLocaleString("en-US", { maximumFractionDigits: 2 })}</div>
              <div className="text-xs text-muted-foreground">{address ? new Date().toLocaleString() : "—"}</div>
            </div>
            <div className="bg-card/50 border border-border/60 rounded p-3">
              <div className="text-xs text-muted-foreground">{t("summary.contract")}</div>
              <div className="truncate text-sm text-foreground">{address || "—"}</div>
              <div className="text-xs text-muted-foreground">XLM: {wallet?.xlm ?? "0"} • STLT: {wallet?.stlt ?? "0"}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Asset Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>{t("distribution.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground mb-2">Composição por valor (USD)</div>
          <div className="space-y-2">
            {assets.map((a) => {
              const pct = totalValueUSD > 0 ? (a.valueUSD / totalValueUSD) * 100 : 0;
              return (
                <Link key={a.key} href={a.href} className="block">
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-foreground">{a.name}</div>
                    <div className="text-muted-foreground">{pct.toFixed(1)}%</div>
                  </div>
                  <Progress value={pct} className="mt-1" />
                  <div className="text-xs text-muted-foreground mt-1">
                    {t("distribution.qty_label", { qty: a.qty.toLocaleString("pt-BR", { maximumFractionDigits: 7 }), brl: "—", usd: a.valueUSD.toLocaleString("en-US", { maximumFractionDigits: 2 }) })}
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Statement and Reports */}
      <Card>
        <CardHeader>
          <CardTitle>{t("reports.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 text-sm">
            <Link href="/wallet" className="px-3 py-2 rounded bg-secondary/30 border border-border/60">{t("reports.view_full")}</Link>
          </div>
        </CardContent>
      </Card>

      {/* Avisos Importantes */}
      <Card>
        <CardHeader>
          <CardTitle>{t("notices.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 text-sm space-y-1 text-primary">
            <li>{t("notices.n1")}</li>
            <li>{t("notices.n2")}</li>
            <li>{t("notices.n3")}</li>
          </ul>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
