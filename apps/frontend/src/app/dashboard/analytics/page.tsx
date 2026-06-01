"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { TrendingUp, BarChart3 } from "lucide-react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function DashboardAnalyticsPage() {
  const t = useTranslations("dashboard.analytics");
  const [data, setData] = useState<{ tvl: string | null; volume24h: string | null; mintBurnRatio: string | null }>({
    tvl: null,
    volume24h: null,
    mintBurnRatio: null,
  });
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "90d">("30d");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${apiUrl}/analytics/overview`, { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) setData({ tvl: null, volume24h: null, mintBurnRatio: null });
          return;
        }
        const body = (await res.json()) as any;
        if (!cancelled) {
          setData({
            tvl: body?.tvl ?? null,
            volume24h: body?.volume24h ?? null,
            mintBurnRatio: body?.mintBurnRatio ?? null,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [timeframe]);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <Image src="/capa.png" alt="Stellaro background" fill priority sizes="100vw" className="object-cover object-center opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/85 to-background/60" />
      <div className="absolute inset-0 bg-[radial-gradient(1000px_circle_at_20%_15%,rgba(var(--stellaro-accent-rgb),0.14),transparent_60%),radial-gradient(900px_circle_at_80%_10%,rgba(197,135,230,0.10),transparent_55%)]" />
      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-8 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
        {loading ? (
          <div className="rounded-xl border border-border/60 bg-secondary/10 px-3 py-2 text-sm text-muted-foreground">
            {t("loading")}
          </div>
        ) : null}
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold mb-2">{t("title")}</h1>
            <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={timeframe === "7d" ? "default" : "outline"}
              onClick={() => setTimeframe("7d")}
              size="sm"
            >
              7D
            </Button>
            <Button
              variant={timeframe === "30d" ? "default" : "outline"}
              onClick={() => setTimeframe("30d")}
              size="sm"
            >
              30D
            </Button>
            <Button
              variant={timeframe === "90d" ? "default" : "outline"}
              onClick={() => setTimeframe("90d")}
              size="sm"
            >
              90D
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {t("tvl")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.tvl ?? "—"}</div>
              <div className="flex items-center gap-1 mt-2 text-muted-foreground">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">Timeframe: {timeframe}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Volume 24h
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.volume24h ?? "—"}</div>
              <div className="flex items-center gap-1 mt-2 text-muted-foreground">
                <BarChart3 className="w-4 h-4" />
                <span className="text-sm">Origem: /analytics/overview</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Mint/Burn ratio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.mintBurnRatio ?? "—"}</div>
              <div className="text-xs text-muted-foreground mt-2">Sem dados locais no frontend.</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              {t("performanceMetrics")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Gráficos avançados dependem de séries temporais no backend. Esta tela exibe apenas dados reais disponíveis no momento.
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
