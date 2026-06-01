"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { useWalletStore } from "@/state/wallet";
import { getHorizonBaseUrl } from "@/lib/soroban";

type HorizonOperationsResponse = {
  _embedded?: {
    records?: Array<Record<string, unknown>>;
  };
};

type TxRow = {
  id: string;
  type: string;
  createdAt: string;
  txHash: string;
  asset: string;
  amount: string;
};

export default function TransactionHistoryPage() {
  const t = useTranslations("transactions");
  const address = useWalletStore((s) => s.address);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<TxRow[]>([]);

  useEffect(() => {
    let active = true;
    const horizon = getHorizonBaseUrl();

    (async () => {
      if (!address) {
        if (!active) return;
        setRows([]);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${horizon}/accounts/${address}/operations?order=desc&limit=25`, {
          cache: "no-store",
        });
        if (!res.ok) {
          throw new Error(`Horizon error: ${res.status}`);
        }
        const body = (await res.json()) as HorizonOperationsResponse;
        const records = body?._embedded?.records ?? [];

        const mapped: TxRow[] = records.map((r) => {
          const record = r as Record<string, unknown>;
          const id = String(record.id ?? "");
          const type = String(record.type ?? record.type_i ?? "unknown");
          const createdAt = String(record.created_at ?? "");
          const txHash = String(record.transaction_hash ?? "");

          const amount = typeof record.amount === "string" ? record.amount : "";
          const assetCode =
            typeof record.asset_code === "string"
              ? record.asset_code
              : typeof record.asset_type === "string"
                ? record.asset_type
                : "";

          return {
            id,
            type,
            createdAt,
            txHash,
            asset: assetCode,
            amount,
          };
        });

        if (!active) return;
        setRows(mapped);
      } catch (e) {
        if (!active) return;
        const msg = e instanceof Error ? e.message : "Falha ao carregar histórico";
        setError(msg);
        setRows([]);
      } finally {
        if (!active) return;
        setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [address]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesFilter = filter === "all" ? true : r.type === filter;
      const matchesSearch = !q
        ? true
        : r.id.toLowerCase().includes(q) || r.txHash.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [rows, filter, search]);

  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    rows.forEach((r) => {
      if (r.type) types.add(r.type);
    });
    return Array.from(types).sort();
  }, [rows]);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <Image src="/capa.png" alt="Stellaro background" fill priority sizes="100vw" className="object-cover object-center opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/92 to-background/75" />
      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-8 p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold mb-1">{t("history.title")}</h1>
            <p className="text-xs text-muted-foreground">{t("history.subtitle")}</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search transaction ID or hash..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-secondary/30 border border-border/60 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Badge
                variant={filter === "all" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setFilter("all")}
              >
                All
              </Badge>
              {availableTypes.slice(0, 8).map((type) => (
                <Badge
                  key={type}
                  variant={filter === type ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setFilter(type)}
                >
                  {type}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {!address ? (
              <div className="text-sm text-muted-foreground">Conecte uma carteira para carregar histórico real via Horizon.</div>
            ) : loading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : error ? (
              <div className="text-sm text-muted-foreground">{error}</div>
            ) : filtered.length === 0 ? (
              <div className="text-sm text-muted-foreground">Nenhuma transação encontrada.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border/60">
                    <tr>
                      <th className="text-left py-2 px-2">ID</th>
                      <th className="text-left py-2 px-2">Type</th>
                      <th className="text-left py-2 px-2">Asset</th>
                      <th className="text-left py-2 px-2">Amount</th>
                      <th className="text-left py-2 px-2">Created</th>
                      <th className="text-left py-2 px-2">Hash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((tx) => (
                      <tr key={tx.id} className="border-b border-border/60 hover:bg-secondary/20">
                        <td className="font-mono text-xs py-2 px-2">{tx.id}</td>
                        <td className="py-2 px-2">
                          <Badge variant="outline" className="text-primary">
                            {tx.type}
                          </Badge>
                        </td>
                        <td className="py-2 px-2">{tx.asset || "—"}</td>
                        <td className="font-bold py-2 px-2">{tx.amount || "—"}</td>
                        <td className="text-xs text-muted-foreground py-2 px-2">{tx.createdAt || "—"}</td>
                        <td className="font-mono text-xs text-muted-foreground py-2 px-2 break-all">{tx.txHash || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
