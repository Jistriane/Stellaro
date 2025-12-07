"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Plus, Minus, BarChart3, TrendingUp } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

export default function LiquidityPoolsPage() {
  const t = useTranslations("liquidity");
  const [pools, setPools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPool, setSelectedPool] = useState<string | null>(null);

  useEffect(() => {
    const mockPools = [
      {
        id: "pool-1",
        pair: "STLT-XLM",
        tvl: 2500000,
        volume24h: 156000,
        fee: "0.3%",
        apy: 45.2,
        yourLiquidity: 45000,
        share: 1.8,
        token0: { symbol: "STLT", amount: 125000, price: 2.5 },
        token1: { symbol: "XLM", amount: 100000, price: 0.125 },
        reserves: { token0: 6944444, token1: 5555556 },
      },
      {
        id: "pool-2",
        pair: "STLT-USDC",
        tvl: 3800000,
        volume24h: 248000,
        fee: "0.3%",
        apy: 38.5,
        yourLiquidity: 75000,
        share: 1.97,
        token0: { symbol: "STLT", amount: 180000, price: 2.5 },
        token1: { symbol: "USDC", amount: 450000, price: 1.0 },
        reserves: { token0: 9127000, token1: 22835000 },
      },
      {
        id: "pool-3",
        pair: "XLM-USDC",
        tvl: 5200000,
        volume24h: 312000,
        fee: "0.05%",
        apy: 22.3,
        yourLiquidity: 125000,
        share: 2.4,
        token0: { symbol: "XLM", amount: 800000, price: 0.125 },
        token1: { symbol: "USDC", amount: 100000, price: 1.0 },
        reserves: { token0: 41600000, token1: 5200000 },
      },
    ];

    setPools(mockPools);
    setSelectedPool("pool-1");
    setLoading(false);
  }, []);

  const currentPool = pools.find((p) => p.id === selectedPool);

  const chartData = [
    { time: "Mon", tvl: 2100000, volume: 120000 },
    { time: "Tue", tvl: 2250000, volume: 135000 },
    { time: "Wed", tvl: 2350000, volume: 142000 },
    { time: "Thu", tvl: 2400000, volume: 138000 },
    { time: "Fri", tvl: 2480000, volume: 156000 },
    { time: "Sat", tvl: 2500000, volume: 148000 },
    { time: "Sun", tvl: 2500000, volume: 145000 },
  ];

  const impermanentLossData = [
    { day: "Day 1", loss: 0.0 },
    { day: "Day 7", loss: 2.3 },
    { day: "Day 30", loss: 5.1 },
    { day: "Day 90", loss: 7.8 },
  ];

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2">{t("pools.title")}</h1>
            <p className="text-gray-400">{t("pools.subtitle")}</p>
          </div>
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Liquidity
          </Button>
        </div>

        {/* Overall Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">Total Liquidity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                ${(pools.reduce((sum, p) => sum + p.yourLiquidity, 0) / 1000).toFixed(0)}K
              </p>
              <p className="text-xs text-green-400 mt-1">+12.5% this week</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">Total Volume (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                ${(pools.reduce((sum, p) => sum + p.volume24h, 0) / 1000).toFixed(0)}K
              </p>
              <p className="text-xs text-blue-400 mt-1">All your pools</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">Average APY</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {(pools.reduce((sum, p) => sum + p.apy, 0) / pools.length).toFixed(1)}%
              </p>
              <p className="text-xs text-green-400 mt-1">Farm rewards included</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">Total Pools</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{pools.length}</p>
              <p className="text-xs text-gray-400 mt-1">Active positions</p>
            </CardContent>
          </Card>
        </div>

        {/* Pool Selector Tabs */}
        <div className="flex gap-2 flex-wrap">
          {pools.map((pool) => (
            <button
              key={pool.id}
              onClick={() => setSelectedPool(pool.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedPool === pool.id
                  ? "bg-blue-600 text-white"
                  : "bg-slate-700 text-gray-300 hover:bg-slate-600"
              }`}
            >
              {pool.pair}
            </button>
          ))}
        </div>

        {currentPool && (
          <>
            {/* Pool Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400">Pool TVL</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    ${(currentPool.tvl / 1000000).toFixed(1)}M
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Total Locked Value</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400">Your Share</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{currentPool.share.toFixed(2)}%</p>
                  <p className="text-xs text-green-400 mt-1">
                    ${(currentPool.yourLiquidity / 1000).toFixed(0)}K value
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400">APY</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-400">
                    {currentPool.apy.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Fee {currentPool.fee}</p>
                </CardContent>
              </Card>
            </div>

            {/* Token Composition */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle>Pool Composition</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>{currentPool.token0.symbol}</span>
                      <span className="text-sm text-gray-400">50%</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full w-1/2 bg-blue-500" />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {currentPool.token0.amount.toLocaleString()} {currentPool.token0.symbol}
                      {" "}
                      @ ${currentPool.token0.price}
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span>{currentPool.token1.symbol}</span>
                      <span className="text-sm text-gray-400">50%</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full w-1/2 bg-green-500" />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {currentPool.token1.amount.toLocaleString()} {currentPool.token1.symbol}
                      {" "}
                      @ ${currentPool.token1.price}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* TVL & Volume Chart */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle>7-Day Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="tvlGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="time" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="tvl"
                      stroke="#3b82f6"
                      fillOpacity={1}
                      fill="url(#tvlGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Impermanent Loss Chart */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Impermanent Loss Risk
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={impermanentLossData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="day" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                    />
                    <Bar
                      dataKey="loss"
                      fill="#ef4444"
                      name="IL Risk %"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                size="lg"
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Liquidity
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1"
              >
                <Minus className="w-4 h-4 mr-2" />
                Remove Liquidity
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
