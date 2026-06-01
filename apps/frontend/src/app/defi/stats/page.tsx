"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { Activity } from "lucide-react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function DefiStatsPage() {
  const t = useTranslations("defi");
  const [stats, setStats] = useState<{ tvl: string | null; volume24h: string | null; mintBurnRatio: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${apiUrl}/analytics/overview`, { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) {
            setStats(null);
            setError(`HTTP ${res.status}`);
          }
          return;
        }
        const body = (await res.json()) as any;
        if (!cancelled) {
          setStats({
            tvl: body?.tvl ?? null,
            volume24h: body?.volume24h ?? null,
            mintBurnRatio: body?.mintBurnRatio ?? null,
          });
        }
      } catch (e) {
        if (!cancelled) {
          setStats(null);
          setError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <Image src="/capa.png" alt="Stellaro background" fill priority sizes="100vw" className="object-cover object-center opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/85 to-background/60" />
      <div className="absolute inset-0 bg-[radial-gradient(1000px_circle_at_20%_15%,rgba(var(--stellaro-accent-rgb),0.14),transparent_60%),radial-gradient(900px_circle_at_80%_10%,rgba(197,135,230,0.10),transparent_55%)]" />
      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-8 p-6">
        <div>
        <h1 className="text-2xl font-semibold mb-1">{t("stats.title")}</h1>
        <p className="text-xs text-muted-foreground">{t("stats.subtitle")}</p>
      </div>

        {/* KPI Grid */}
        {loading ? (
          <div className="rounded-xl border border-border/60 bg-secondary/10 px-3 py-2 text-sm text-muted-foreground">
            Loading...
          </div>
        ) : null}
        {error ? (
          <div className="rounded-xl border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Falha ao carregar /analytics/overview: {error}
          </div>
        ) : null}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">{t("stats.tvl")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.tvl ?? "—"}</div>
              <p className="text-xs text-muted-foreground mt-2">Origem: /analytics/overview</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">Volume 24h</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.volume24h ?? "—"}</div>
              <p className="text-xs text-muted-foreground mt-2">Origem: /analytics/overview</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">Mint/Burn ratio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.mintBurnRatio ?? "—"}</div>
              <p className="text-xs text-muted-foreground mt-2">Sem dados locais no frontend.</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              {t("stats.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Métricas avançadas (TVL histórico, tipos de empréstimo, reservas) dependem de endpoints específicos no backend. Esta tela exibe apenas dados reais disponíveis.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
