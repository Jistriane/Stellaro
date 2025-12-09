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
    
    const label = ts.toLocaleString("pt-BR", { 
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

  useEffect(() => {
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
        <CardTitle>Histórico de Saldo (XLM/USD)</CardTitle>
        <CardDescription>
          {loading
            ? "Carregando dados de mercado..."
            : "Dados simulados das últimas 120h com atualização a cada 5 minutos"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {latest && (
          <div className="mb-3 text-sm text-slate-300">Último preço: ${latest.toFixed(4)} USD</div>
        )}
        <div className="w-full min-h-[320px]">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="t" stroke="currentColor" fontSize={11} minTickGap={24} hide={data.length > 40} />
              <YAxis stroke="currentColor" fontSize={12} domain={["dataMin", "dataMax"]} tickFormatter={(v) => `$${v.toFixed(3)}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0, 0, 0, 0.85)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "6px",
                  fontSize: "13px",
                }}
                labelStyle={{ color: "#cbd5e1", marginBottom: "4px" }}
                itemStyle={{ color: "#38bdf8" }}
                formatter={(value: number) => [`$${value.toFixed(4)}`, "Preço"]}
              />
              <Line
                type="monotone"
                dataKey="v"
                stroke="#38bdf8"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, fill: "#38bdf8" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
