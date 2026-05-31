"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, BarChart3, LineChart as LineChartIcon } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--secondary))",
  "hsl(var(--muted-foreground))",
  "hsl(var(--border))",
];

export default function DashboardAnalyticsPage() {
  const t = useTranslations("dashboard.analytics");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "90d">("30d");

  useEffect(() => {
    setIsMounted(true);

    // Mock data for analytics
    const mockAnalyticsData = {
      tvl: [
        { date: "01 Dec", value: 150000 },
        { date: "05 Dec", value: 175000 },
        { date: "10 Dec", value: 195000 },
        { date: "15 Dec", value: 210000 },
        { date: "20 Dec", value: 235000 },
        { date: "25 Dec", value: 250000 },
        { date: "30 Dec", value: 275000 },
      ],
      assets: [
        { name: "STLT-BRL", value: 150000 },
        { name: "XLM", value: 75000 },
        { name: "USDC", value: 50000 },
      ],
      performance: [
        { month: "Oct", roi: 2.5 },
        { month: "Nov", roi: 3.2 },
        { month: "Dec", roi: 4.1 },
      ],
      summary: {
        tvl: 275000,
        tvlChange: 12.5,
        apy: 8.3,
        apyChange: 0.5,
        loans: 42,
        loansChange: 5,
        liquidations: 2,
        liquidationsChange: -1,
      },
    };

    setData(mockAnalyticsData);
    setLoading(false);
  }, [timeframe]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center">
          <div className="text-muted-foreground">{t("loading")}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <Image src="/capa.png" alt="Stellaro background" fill priority sizes="100vw" className="object-cover object-center opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/85 to-background/60" />
      <div className="absolute inset-0 bg-[radial-gradient(1000px_circle_at_20%_15%,rgba(var(--stellaro-accent-rgb),0.14),transparent_60%),radial-gradient(900px_circle_at_80%_10%,rgba(197,135,230,0.10),transparent_55%)]" />
      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-8 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* TVL Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {t("tvl")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${(data.summary.tvl / 1000).toFixed(1)}K
              </div>
              <div className="flex items-center gap-1 mt-2 text-primary">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">+{data.summary.tvlChange}%</span>
              </div>
            </CardContent>
          </Card>

          {/* APY Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {t("apy")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.summary.apy}%</div>
              <div className="flex items-center gap-1 mt-2 text-primary">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">+{data.summary.apyChange}%</span>
              </div>
            </CardContent>
          </Card>

          {/* Active Loans Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {t("loans")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.summary.loans}</div>
              <div className="flex items-center gap-1 mt-2 text-primary">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">+{data.summary.loansChange}</span>
              </div>
            </CardContent>
          </Card>

          {/* Default Rate Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {t("defaultRate")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0.47%</div>
              <div className="flex items-center gap-1 mt-2 text-destructive">
                <TrendingDown className="w-4 h-4" />
                <span className="text-sm">-0.12%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* TVL Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChartIcon className="w-5 h-5" />
                {t("tvlHistory")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isMounted ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.tvl}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(10, 12, 16, 0.85)",
                        border: "1px solid rgba(255,255,255,0.10)",
                        backdropFilter: "blur(12px)",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] rounded-lg border border-dashed border-border/60" />
              )}
            </CardContent>
          </Card>

          {/* Asset Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                {t("assetDistribution")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isMounted ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.assets}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) =>
                        `${name}: $${(value / 1000).toFixed(0)}K`
                      }
                      outerRadius={80}
                      fill="hsl(var(--primary))"
                      dataKey="value"
                    >
                      {data.assets.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(10, 12, 16, 0.85)",
                        border: "1px solid rgba(255,255,255,0.10)",
                        backdropFilter: "blur(12px)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] rounded-lg border border-dashed border-border/60" />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              {t("performanceMetrics")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isMounted ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.performance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(10, 12, 16, 0.85)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      backdropFilter: "blur(12px)",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="roi" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] rounded-lg border border-dashed border-border/60" />
            )}
          </CardContent>
        </Card>

        {/* Bottom Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t("utilization")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">73.5%</div>
              <Progress value={73.5} className="mt-3" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t("liquidationRatio")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">98.4%</div>
              <p className="text-xs text-muted-foreground mt-2">
                {t("healthyStatus")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t("reserveRatio")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">127%</div>
              <p className="text-xs text-muted-foreground mt-2">
                {t("surplusCollateral")}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </div>
  );
}
