"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useTranslations } from "next-intl";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Activity, Zap } from "lucide-react";

export default function DefiStatsPage() {
  const t = useTranslations("defi");
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const mockStats = {
      tvl: 275000,
      loans: 42,
      utilization: 73.5,
      apy: 8.3,
      reserves: 350000,
      reserveRatio: 127,
      liquidations: 2,
      history: [
        { date: "01 Dec", tvl: 150000, loans: 20 },
        { date: "05 Dec", tvl: 175000, loans: 28 },
        { date: "10 Dec", tvl: 195000, loans: 32 },
        { date: "15 Dec", tvl: 210000, loans: 35 },
        { date: "20 Dec", tvl: 235000, loans: 39 },
        { date: "25 Dec", tvl: 250000, loans: 40 },
        { date: "30 Dec", tvl: 275000, loans: 42 },
      ],
      loanTypes: [
        { type: "Secured (XLM)", value: 180000 },
        { type: "Margin", value: 60000 },
        { type: "Flash Loans", value: 35000 },
      ],
    };

    setStats(mockStats);
    setLoading(false);
  }, []);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">{t("stats.tvl")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${(stats.tvl / 1000).toFixed(1)}K</div>
              <p className="text-xs text-primary mt-2">↑ 12.5% from last week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">{t("stats.loans")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.loans}</div>
              <p className="text-xs text-primary mt-2">↑ 5 from last week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">{t("stats.apy")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.apy}%</div>
              <p className="text-xs text-primary mt-2">↑ 0.5% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">{t("stats.utilization")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.utilization}%</div>
              <p className="text-xs text-muted-foreground mt-2">Pool utilization</p>
            </CardContent>
          </Card>
        </div>

        {/* TVL & Loans Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                TVL Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: "rgba(10, 12, 16, 0.85)", border: "1px solid rgba(255,255,255,0.10)", backdropFilter: "blur(12px)" }} />
                  <Area type="monotone" dataKey="tvl" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.28} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Active Loans Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: "rgba(10, 12, 16, 0.85)", border: "1px solid rgba(255,255,255,0.10)", backdropFilter: "blur(12px)" }} />
                  <Area type="monotone" dataKey="loans" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.28} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Loan Types & Reserve Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Loan Types Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {isMounted ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stats.loanTypes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="type" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: "rgba(10, 12, 16, 0.85)", border: "1px solid rgba(255,255,255,0.10)", backdropFilter: "blur(12px)" }} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] rounded-lg border border-dashed border-border/60" />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Reserve Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-muted-foreground text-sm mb-2">Total Reserves</p>
                <p className="text-2xl font-bold">${(stats.reserves / 1000).toFixed(0)}K</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm mb-2">Collateral Ratio</p>
                <p className="text-2xl font-bold text-primary">{stats.reserveRatio}%</p>
                <p className="text-xs text-muted-foreground mt-1">Above 120% threshold ✓</p>
              </div>
              <div className="pt-2">
                <Progress value={100} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pool Health Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Pool Health Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-muted-foreground text-sm mb-2">Default Rate</p>
                <p className="text-2xl font-bold">0.47%</p>
                <p className="text-xs text-muted-foreground">↓ 0.12% this month</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm mb-2">Avg Collateral</p>
                <p className="text-2xl font-bold">150%</p>
                <p className="text-xs text-primary">Healthy ✓</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm mb-2">Liquidations</p>
                <p className="text-2xl font-bold">{stats.liquidations}</p>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm mb-2">Pool Status</p>
                <p className="text-2xl font-bold text-primary">Active</p>
                <p className="text-xs text-muted-foreground">Operating normally</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
