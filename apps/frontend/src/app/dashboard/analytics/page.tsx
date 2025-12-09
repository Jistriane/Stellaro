"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, BarChart3, LineChart as LineChartIcon } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function DashboardAnalyticsPage() {
  const t = useTranslations("dashboard.analytics");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "90d">("30d");

  useEffect(() => {
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
          <div className="text-slate-400">{t("loading")}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold mb-2">{t("title")}</h1>
            <p className="text-xs text-slate-500">{t("subtitle")}</p>
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
              <div className="flex items-center gap-1 mt-2 text-green-600">
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
              <div className="flex items-center gap-1 mt-2 text-green-600">
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
              <div className="flex items-center gap-1 mt-2 text-green-600">
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
              <div className="flex items-center gap-1 mt-2 text-red-600">
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
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.tvl}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #475569",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#0088FE"
                    strokeWidth={2}
                    dot={{ fill: "#0088FE" }}
                  />
                </LineChart>
              </ResponsiveContainer>
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
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.assets.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #475569",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
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
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.performance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #475569",
                  }}
                />
                <Legend />
                <Bar dataKey="roi" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
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
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-3">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: "73.5%" }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t("liquidationRatio")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">98.4%</div>
              <p className="text-xs text-slate-500 mt-2">
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
              <p className="text-xs text-slate-500 mt-2">
                {t("surplusCollateral")}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
