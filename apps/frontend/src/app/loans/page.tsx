"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getContractIds, viewLoansPool, getWalletBalances } from "@/lib/soroban";
import { useTranslations } from "next-intl";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";
import { useEffect, useState } from "react";
import { useWalletStore } from "@/state/wallet";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function LoansPage() {
  const t = useTranslations("loans");
  const tw = useTranslations("wallet");
  
  // Enable real-time updates when the wallet connects
  useRealTimeUpdates();
  
  const [data, setData] = useState<{
    pool: any;
    wallet: any;
    positions?: { address: string; positions: Array<{ asset: string; balance: string; valueUSD: number; apy?: number; poolId?: string }>; totalUSD: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const address = useWalletStore((s) => s.address);
  
  useEffect(() => {
    async function loadData() {
      try {
        const [pool, wallet] = await Promise.all([
          viewLoansPool(),
          getWalletBalances(address ?? undefined),
        ]);

        let positions:
          | { address: string; positions: Array<{ asset: string; balance: string; valueUSD: number; apy?: number; poolId?: string }>; totalUSD: number }
          | undefined;
        if (address) {
          const res = await fetch(`${apiUrl}/defi/blend/positions/${encodeURIComponent(address)}?quote=USD`, { cache: "no-store" });
          if (res.ok) {
            positions = (await res.json()) as any;
          }
        }

        setData({ pool, wallet, positions });
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

  const { pool, wallet } = data;
  const ids = getContractIds();

  const ltvPct = (Number(pool.ltv_bps ?? 0) / 100).toFixed(2);
  const interestPct = (Number(pool.interest_bps ?? 0) / 100).toFixed(2);
  const positions = data.positions?.positions ?? [];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <Image src="/capa.png" alt="Stellaro background" fill priority sizes="100vw" className="object-cover object-center opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/85 to-background/60" />
      <div className="absolute inset-0 bg-[radial-gradient(1000px_circle_at_20%_15%,rgba(var(--stellaro-accent-rgb),0.14),transparent_60%),radial-gradient(900px_circle_at_80%_10%,rgba(197,135,230,0.10),transparent_55%)]" />
      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-8 p-6">
      {/* Title and timestamp */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("header.title")}</h1>
        <div className="text-xs text-muted-foreground">{t("header.updated_now")}</div>
      </div>

      {/* Introduction and warnings */}
      <Card>
        <CardHeader>
          <CardTitle>{t("intro.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t("intro.p1")}</p>
          <div className="mt-3 rounded border border-primary/30 bg-primary/10 p-3 text-primary text-xs">
            {t("intro.responsibility")}
          </div>
        </CardContent>
      </Card>

      {/* Pool Summary / Parameters */}
      <Card>
        <CardHeader>
          <CardTitle>{t("pool.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">{t("pool.contract")}</div>
          <div className="truncate mb-2 text-foreground">{ids.LOANSPOOL_CONTRACT_ID || "—"}</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>{t("pool.ltv_max")}: <b>{ltvPct}%</b></div>
            <div>{t("pool.apr")}: <b>{interestPct}%</b></div>
            <div>{t("pool.accounts")}: <b>{pool.accounts}</b></div>
            <div>{t("pool.total_deposits")}: <b>{pool.total_deposits}</b></div>
            <div>{t("pool.total_borrowed")}: <b>{pool.total_borrowed}</b></div>
          </div>
        </CardContent>
      </Card>

      {/* Active Loans */}
      <Card>
        <CardHeader>
          <CardTitle>{t("active.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {!address ? (
            <div className="text-sm text-muted-foreground">{tw("login_to_view")}</div>
          ) : positions.length === 0 ? (
            <div className="text-sm text-muted-foreground">{t("active.none")}</div>
          ) : (
            <div className="space-y-3">
              {positions.map((p) => (
                <div key={`${p.asset}-${p.balance}`} className="rounded border border-border/60 bg-card/50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm">
                      <div className="text-foreground"><b>{p.asset}</b></div>
                      <div className="text-muted-foreground text-xs">
                        {typeof p.apy === "number" ? t("active.effective_rate", { apr: p.apy.toFixed(2) }) : null}
                      </div>
                    </div>
                    <div className="text-xs px-2 py-1 rounded bg-secondary/30 border border-border/60 text-foreground">{t("pool.title")}</div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-6 gap-3 text-sm">
                    <div>
                      <div className="text-muted-foreground text-xs">{t("active.value")}</div>
                      <div className="text-foreground">{Number(p.balance || 0).toLocaleString("pt-BR", { maximumFractionDigits: 7 })}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">{t("active.collateral")}</div>
                      <div className="text-foreground">—</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">{t("active.balance_due")}</div>
                      <div className="text-foreground">US$ {Number(p.valueUSD || 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">{t("active.due_in")}</div>
                      <div className="text-foreground">—</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">{t("active.risk")}</div>
                      <div className="text-primary">{t("active.monitor_collateral")}</div>
                    </div>
                    <div className="flex items-end">
                      <div className="flex gap-2">
                        <Link href="/wallet" className="px-3 py-2 rounded bg-secondary/30 border border-border/60 text-foreground text-xs">{t("active.details")}</Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conditions and Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>{t("conditions.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">{t("conditions.fees")}</div>
              <div>{t("conditions.apr_line", { apr: interestPct })}</div>
            </div>
            <div>
              <div className="text-muted-foreground">{t("conditions.limits")}</div>
              <div>{t("conditions.range")}</div>
            </div>
            <div>
              <div className="text-muted-foreground">{t("conditions.collateral")}</div>
              <div>{t("conditions.ltv_assets", { ltv: ltvPct })}</div>
            </div>
          </div>
          <ul className="mt-3 list-disc pl-5 text-xs text-muted-foreground space-y-1">
            <li>{t("conditions.note_iof")}</li>
            <li>{t("conditions.note_late")}</li>
            <li>{t("conditions.note_liquidation")}</li>
          </ul>
        </CardContent>
      </Card>

      {/* Step-by-step contracting */}
      <Card>
        <CardHeader>
          <CardTitle>{t("steps.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground">
            <li>{t("steps.s1")}</li>
            <li>{t("steps.s2")}</li>
            <li>{t("steps.s3")}</li>
            <li>{t("steps.s4")}</li>
          </ol>
          <div className="mt-3 flex gap-2">
            <button disabled className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm opacity-60">
              {t("steps.apply")}
            </button>
            <button disabled className="px-4 py-2 rounded bg-secondary/30 border border-border/60 text-foreground text-sm opacity-60">
              {t("steps.track")}
            </button>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Operações de contratação e acompanhamento exigem fluxo on-chain e endpoints dedicados no backend.
          </div>
        </CardContent>
      </Card>

      {/* Collateral and Limit Management */}
      <Card>
        <CardHeader>
          <CardTitle>{t("collateral.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Para evitar dados simulados, limites e colateral exibidos aqui dependem de leitura on-chain das suas posições e/ou indexação no backend.
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <button disabled className="px-3 py-2 rounded bg-secondary/30 border border-border/60 text-foreground opacity-60">{t("collateral.add")}</button>
            <button disabled className="px-3 py-2 rounded bg-secondary/30 border border-border/60 text-foreground opacity-60">{t("collateral.remove")}</button>
            <button disabled className="px-3 py-2 rounded bg-secondary/30 border border-border/60 text-foreground opacity-60">{t("collateral.renegotiate")}</button>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">{t("collateral.note_ltv")}</div>
        </CardContent>
      </Card>

      {/* Alerts and Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>{t("alerts.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 text-sm space-y-1 text-primary">
            <li>{t("alerts.item1")}</li>
            <li>{t("alerts.item2")}</li>
          </ul>
        </CardContent>
      </Card>

      {/* Help & FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>{t("faq.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t("faq.text")}</p>
          <div className="mt-3 flex gap-2 text-sm">
            <Link href="/docs" className="px-3 py-2 rounded bg-secondary/30 border border-border/60 text-foreground">{t("faq.view_faq")}</Link>
            <Link href="/help" className="px-3 py-2 rounded bg-secondary/30 border border-border/60 text-foreground">{t("faq.need_help")}</Link>
          </div>
          <div className="text-xs text-muted-foreground mt-2">{t("faq.security_note")}</div>
        </CardContent>
      </Card>

      {/* Legal and Contractual Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t("legal.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/docs" className="px-3 py-2 rounded bg-secondary/30 border border-border/60 text-foreground">{t("legal.loan_contract")}</Link>
            <Link href="/docs" className="px-3 py-2 rounded bg-secondary/30 border border-border/60 text-foreground">{t("legal.loan_terms")}</Link>
            <Link href="/help" className="px-3 py-2 rounded bg-secondary/30 border border-border/60 text-foreground">{t("legal.loan_faq")}</Link>
          </div>
          <div className="text-xs text-muted-foreground mt-2">{t("legal.read_first")}</div>
        </CardContent>
      </Card>

      {/* Educational Content and Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>{t("education.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 text-sm space-y-1 text-muted-foreground">
            <li>{t("education.item1")}</li>
            <li>{t("education.item2")}</li>
            <li>{t("education.item3")}</li>
          </ul>
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <button disabled className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm opacity-60">{t("quick.apply")}</button>
        <button disabled className="px-4 py-2 rounded bg-secondary/30 border border-border/60 text-foreground text-sm opacity-60">{t("quick.simulate")}</button>
        <button disabled className="px-4 py-2 rounded bg-secondary/30 border border-border/60 text-foreground text-sm opacity-60">{t("quick.track")}</button>
        <button disabled className="px-4 py-2 rounded bg-secondary/30 border border-border/60 text-foreground text-sm opacity-60">{t("quick.prepay")}</button>
        <button disabled className="px-4 py-2 rounded bg-secondary/30 border border-border/60 text-foreground text-sm opacity-60">{t("quick.support")}</button>
      </div>
      </div>
    </div>
  );
}
