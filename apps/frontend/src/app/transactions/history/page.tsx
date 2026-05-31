"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Download, Search, Filter } from "lucide-react";

export default function TransactionHistoryPage() {
  const t = useTranslations("transactions");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const mockTransactions = [
      {
        id: "TXN-001",
        type: "Borrow",
        asset: "STLT",
        amount: 1000,
        date: "2025-12-06",
        time: "14:30",
        status: "Completed",
        hash: "a1b2c3d4...",
      },
      {
        id: "TXN-002",
        type: "Deposit",
        asset: "XLM",
        amount: 500,
        date: "2025-12-05",
        time: "10:15",
        status: "Completed",
        hash: "e5f6g7h8...",
      },
      {
        id: "TXN-003",
        type: "Withdraw",
        asset: "STLT",
        amount: 500,
        date: "2025-12-04",
        time: "16:45",
        status: "Completed",
        hash: "i9j0k1l2...",
      },
      {
        id: "TXN-004",
        type: "Repay",
        asset: "STLT",
        amount: 250,
        date: "2025-12-03",
        time: "09:20",
        status: "Completed",
        hash: "m3n4o5p6...",
      },
      {
        id: "TXN-005",
        type: "Add Liquidity",
        asset: "STLT-XLM",
        amount: 300,
        date: "2025-12-02",
        time: "11:00",
        status: "Completed",
        hash: "q7r8s9t0...",
      },
      {
        id: "TXN-006",
        type: "Swap",
        asset: "XLM → USDC",
        amount: 100,
        date: "2025-12-01",
        time: "15:30",
        status: "Completed",
        hash: "u1v2w3x4...",
      },
    ];

    setTransactions(mockTransactions);
    setLoading(false);
  }, [filter]);

  const getTypeBadge = (type: string): { variant: "default" | "secondary" | "outline" | "destructive"; className?: string } => {
    switch (type) {
      default:
        return { variant: "secondary", className: "text-primary" };
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

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
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Search & Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search transaction ID or hash..."
                  className="w-full pl-10 pr-4 py-2 bg-secondary/30 border border-border/60 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="flex gap-2 mt-4 flex-wrap">
              <Badge
                variant={filter === "all" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setFilter("all")}
              >
                All
              </Badge>
              {["Borrow", "Deposit", "Withdraw", "Repay", "Swap"].map(
                (type) => (
                  <Badge
                    key={type}
                    variant={filter === type ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setFilter(type)}
                  >
                    {type}
                  </Badge>
                )
              )}
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border/60">
                  <tr>
                    <th className="text-left py-2 px-2">ID</th>
                    <th className="text-left py-2 px-2">Type</th>
                    <th className="text-left py-2 px-2">Asset</th>
                    <th className="text-left py-2 px-2">Amount</th>
                    <th className="text-left py-2 px-2">Date & Time</th>
                    <th className="text-left py-2 px-2">Status</th>
                    <th className="text-left py-2 px-2">Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const typeBadge = getTypeBadge(tx.type);
                    return (
                    <tr key={tx.id} className="border-b border-border/60 hover:bg-secondary/20">
                      <td className="font-mono text-xs py-2 px-2">{tx.id}</td>
                      <td className="py-2 px-2">
                        <Badge variant={typeBadge.variant} className={typeBadge.className}>
                          {tx.type}
                        </Badge>
                      </td>
                      <td className="py-2 px-2">{tx.asset}</td>
                      <td className="font-bold py-2 px-2">
                        {tx.amount.toLocaleString()}
                      </td>
                      <td className="text-xs text-muted-foreground py-2 px-2">
                        {tx.date} {tx.time}
                      </td>
                      <td className="py-2 px-2">
                        <Badge variant="secondary" className="text-primary">
                          ✓ {tx.status}
                        </Badge>
                      </td>
                      <td className="font-mono text-xs text-muted-foreground hover:text-foreground cursor-pointer py-2 px-2">
                        {tx.hash}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">Total Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{transactions.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">Total Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                ${transactions.reduce((sum, tx) => sum + tx.amount, 0).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Moved this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">100%</p>
              <p className="text-xs text-muted-foreground mt-1">All transactions succeeded</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
