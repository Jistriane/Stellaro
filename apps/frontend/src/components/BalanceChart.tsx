"use client";

import { useEffect, useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

type Point = { t: string; v: number };

// Simulated real-time data generator for XLM/USD
function generateRealisticData(): Point[] {
  const now = Date.now();
  const basePrice = 0.095; // XLM price around $0.095
  const points: Point[] = [];
  
  for (let i = 120; i >= 0; i--) {
    const timestamp = now - i * 3600000; // hourly intervals
    const ts = new Date(timestamp);
    const volatility = (Math.random() - 0.5) * 0.003; // ±0.3% variation
    const trend = Math.sin(i / 20) * 0.002; // gentle wave pattern
    const price = basePrice + volatility + trend;
    
    const label = ts.toLocaleString("en-US", { 
      weekday: "short", 
      hour: "2-digit", 
      minute: "2-digit" 
    });
    
    points.push({ t: label, v: Number(price.toFixed(4)) });
  }
  
  return points;
}

export default function BalanceChart() {
  const [data, setData] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // Initial load
    setData(generateRealisticData());
    setLoading(false);
    
    // Update every 5 minutes with slight variations
    const interval = setInterval(() => {
      setData(generateRealisticData());
    }, 300_000);

    return () => clearInterval(interval);
  }, []);

  const latest = useMemo(() => data[data.length - 1]?.v ?? null, [data]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Balance History (XLM/USD)</CardTitle>
        <CardDescription>
          {loading
            ? "Loading market data..."
            : "Simulated data from the last 120h with updates every 5 minutes"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {latest && (
          <div className="mb-3 text-sm text-muted-foreground">Latest price: ${latest.toFixed(4)} USD</div>
        )}
        <div className="w-full min-h-[320px]">
          {isMounted ? (
            <ResponsiveContainer width="100%" height={320} minWidth={280} minHeight={320}>
              <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="t" stroke="hsl(var(--muted-foreground))" fontSize={11} minTickGap={24} hide={data.length > 40} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={["dataMin", "dataMax"]} tickFormatter={(v) => `$${v.toFixed(3)}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(10, 12, 16, 0.85)",
                    border: "1px solid rgba(244, 236, 220, 0.10)",
                    borderRadius: "14px",
                    fontSize: "13px",
                    backdropFilter: "blur(12px)",
                  }}
                  labelStyle={{ color: "rgb(244, 236, 220)", marginBottom: "4px" }}
                  itemStyle={{ color: "hsl(var(--primary))" }}
                  formatter={(value: number) => [`$${value.toFixed(4)}`, "Price"]}
                />
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[320px] items-center justify-center rounded-lg border border-dashed border-border/60 text-sm text-muted-foreground">
              Chart loading...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
