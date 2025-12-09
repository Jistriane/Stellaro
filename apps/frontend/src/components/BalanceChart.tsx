"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

type Point = { t: string; v: number };

const fallbackData: Point[] = [
  { t: "T-5", v: 10.2 },
  { t: "T-4", v: 10.4 },
  { t: "T-3", v: 10.35 },
  { t: "T-2", v: 10.6 },
  { t: "T-1", v: 10.55 },
  { t: "T-0", v: 10.7 },
];

export default function BalanceChart() {
  const [data, setData] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"coingecko" | "fallback">("coingecko");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        "https://api.coingecko.com/api/v3/coins/stellar/market_chart?vs_currency=usd&days=7&interval=hourly",
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error("bad_response");
      const json = await res.json();
      const points: Point[] = (json?.prices ?? []).slice(-120).map((p: [number, number]) => {
        const ts = new Date(p[0]);
        const label = ts.toLocaleString("pt-BR", { weekday: "short", hour: "2-digit", minute: "2-digit" });
        return { t: label, v: Number(p[1]) };
      });

      if (!points.length) throw new Error("empty_payload");
      setData(points);
      setSource("coingecko");
    } catch (err) {
      console.error("[BalanceChart] fetch failed", err);
      setError("Não foi possível carregar dados em tempo real agora.");
      setData(fallbackData);
      setSource("fallback");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      await loadData();
    };

    tick();
    const id = setInterval(tick, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [loadData]);

  const latest = useMemo(() => data[data.length - 1]?.v ?? null, [data]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Histórico de Saldo (XLM/USD)</CardTitle>
        <CardDescription>
          {loading
            ? "Carregando dados reais de mercado..."
            : source === "coingecko"
            ? "Dados reais das últimas 72h via CoinGecko"
            : "Dados temporários enquanto a API está indisponível"}
        </CardDescription>
        {error && (
          <div className="text-amber-300 text-xs mt-2">{error} Exibindo série temporária de segurança.</div>
        )}
      </CardHeader>
      <CardContent>
        {latest && (
          <div className="mb-3 text-sm text-slate-300">Último preço: {latest.toFixed(4)} USD</div>
        )}
        <div className="w-full h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="t" stroke="currentColor" fontSize={11} minTickGap={24} hide={data.length > 40} />
              <YAxis stroke="currentColor" fontSize={12} domain={["dataMin", "dataMax"]} tickFormatter={(v) => v.toFixed(2)} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0, 0, 0, 0.85)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  borderRadius: "6px",
                }}
                labelStyle={{ color: "#fff" }}
                itemStyle={{ color: "#fff" }}
                formatter={(value: number) => `${value.toFixed(4)} USD`}
              />
              <Line type="monotone" dataKey="v" stroke="#7dd3fc" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
