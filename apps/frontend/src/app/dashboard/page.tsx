"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  viewLoansPool,
  getWalletBalances,
  hasValidVc,
} from "@/lib/soroban";
import { useTranslations } from "next-intl";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";
import { useEffect, useState } from "react";
import { useWalletStore } from "@/state/wallet";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function DashboardPage() {
  const t = useTranslations("dashboard");

  // Enable real-time updates when the wallet connects
  useRealTimeUpdates();
  
  const [data, setData] = useState<{
    loans: any;
    balances: any;
    totalUSD: number;
    daoTotal: number;
    isCompliant: boolean | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const address = useWalletStore((s) => s.address);
  
  useEffect(() => {
    async function loadData() {
      try {
        const loans = await viewLoansPool();
        const balances = await getWalletBalances(address ?? undefined);

        let totalUSD = 0;
        let daoTotal = 0;
        let isCompliant: boolean | null = null;

        if (address) {
          const [posRes, daoRes, vc] = await Promise.all([
            fetch(`${apiUrl}/defi/blend/positions/${encodeURIComponent(address)}?quote=USD`, { cache: "no-store" }),
            fetch(`${apiUrl}/chain/dao/proposals?start=1&limit=1`, { cache: "no-store" }),
            hasValidVc(address),
          ]);
          if (posRes.ok) {
            const pos = (await posRes.json()) as any;
            totalUSD = Number(pos?.totalUSD ?? 0) || 0;
          }
          if (daoRes.ok) {
            const body = (await daoRes.json()) as any;
            daoTotal = Number(body?.total ?? 0) || 0;
          }
          isCompliant = vc;
        }

        setData({ loans, balances, totalUSD, daoTotal, isCompliant });
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

  if (!data) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center">
          <div className="text-muted-foreground">Error loading data</div>
        </div>
      </div>
    );
  }

  const { loans, balances } = data;
  const stlt = Number.parseFloat(balances.stlt || "0");
  const xlm = Number.parseFloat(balances.xlm || "0");

  function truncatePubKey(pk?: string) {
    if (!pk) return "—";
    return pk.length > 12 ? `${pk.slice(0, 6)}...${pk.slice(-6)}` : pk;
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <Image src="/capa.png" alt="Stellaro background" fill priority sizes="100vw" className="object-cover object-center opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/92 to-background/75" />
      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-8 p-6">
      {/* Branding + Greeting */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary/20 border border-border/60 flex items-center justify-center text-primary font-bold">S</div>
          <div>
            <h1 className="text-2xl font-semibold">{t("greeting.welcome_back")}</h1>
            <div className="text-xs text-muted-foreground">{t("greeting.stellar_key")} {truncatePubKey(address ?? undefined)}</div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">{t("greeting.updated_now")}</div>
      </div>

      {/* Balances */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>STLT</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{stlt.toLocaleString("en-US", { maximumFractionDigits: 7 })}</div>
            <div className="text-xs text-muted-foreground">{t("balances.available")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total (USD)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              $ {data.totalUSD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-muted-foreground">{address ? t("balances.available") : "—"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>XLM</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{xlm.toLocaleString("en-US", { maximumFractionDigits: 4 })}</div>
            <div className="text-xs text-muted-foreground">{t("balances.available")}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick access */}
      <Card>
        <CardHeader>
          <CardTitle>{t("quick_access.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Link className="px-3 py-2 rounded bg-primary text-primary-foreground text-sm" href="/pix">{t("quick_access.deposit_pix")}</Link>
            <Link className="px-3 py-2 rounded bg-secondary/30 border border-border/60 text-foreground text-sm" href="/stablecoin">{t("quick_access.swap_stablecoins")}</Link>
            <Link className="px-3 py-2 rounded bg-secondary/30 border border-border/60 text-foreground text-sm" href="/loans">{t("quick_access.request_loan")}</Link>
            <Link className="px-3 py-2 rounded bg-secondary/30 border border-border/60 text-foreground text-sm" href="/governance">{t("quick_access.governance")}</Link>
            <Link className="px-3 py-2 rounded bg-secondary/30 border border-border/60 text-foreground text-sm" href="/profile">{t("quick_access.profile_kyc")}</Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("notifications.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between bg-secondary/20 border border-border/60 rounded px-3 py-2">
                <span>SSI: {data.isCompliant ? "ok" : "pendente"}</span>
                <Link className="text-xs underline text-primary" href="/profile">{t("notifications.view")}</Link>
              </li>
              <li className="flex items-center justify-between bg-secondary/20 border border-border/60 rounded px-3 py-2">
                <span>DAO: {data.daoTotal.toLocaleString("pt-BR")} propostas</span>
                <Link className="text-xs underline text-primary" href="/governance">{t("notifications.view")}</Link>
              </li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("recent.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">Histórico e movimentos via Horizon na página da wallet.</div>
            <div className="mt-3">
              <Link className="text-sm underline text-primary" href="/wallet">{t("recent.view_all")}</Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("loans.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground mb-2">{t("loans.pool_ltv_interest", { ltv: loans.ltv_bps ?? 0, interest: loans.interest_bps ?? 0 })}</div>
          <div className="text-sm text-muted-foreground">{address ? "Detalhes e simulação na página Loans." : "Conecte a wallet para ver dados."}</div>
          <div className="mt-3">
            <Link className="text-sm underline text-primary" href="/loans">{t("quick_access.request_loan")}</Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("portfolio.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Total (USD):{" "}
            <b className="text-foreground">
              $ {data.totalUSD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </b>
          </div>
          <div className="mt-3">
            <Link className="text-sm underline text-primary" href="/portfolio">{t("portfolio.title")}</Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("profile.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary/20 border border-border/60 flex items-center justify-center">👤</div>
            <div>
              <div className="text-sm">{t("profile.user")}</div>
              <div className="text-xs text-muted-foreground">KYC: <b className="text-primary">{data.isCompliant ? "verificado" : "pendente"}</b></div>
            </div>
          </div>
          <div className="mt-3">
            <Link className="px-3 py-2 rounded bg-primary text-primary-foreground text-sm" href="/profile">{t("profile.complete_kyc")}</Link>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
