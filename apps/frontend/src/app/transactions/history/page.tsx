"use client";

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

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Borrow":
        return "bg-red-900 text-red-200";
      case "Deposit":
      case "Add Liquidity":
        return "bg-green-900 text-green-200";
      case "Withdraw":
      case "Repay":
        return "bg-orange-900 text-orange-200";
      case "Swap":
        return "bg-blue-900 text-blue-200";
      default:
        return "bg-gray-900 text-gray-200";
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold mb-1">{t("history.title")}</h1>
            <p className="text-xs text-slate-500">{t("history.subtitle")}</p>
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
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search transaction ID or hash..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
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
                <thead className="border-b border-slate-200 dark:border-slate-700">
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
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="font-mono text-xs py-2 px-2">{tx.id}</td>
                      <td className="py-2 px-2">
                        <Badge className={getTypeColor(tx.type)}>
                          {tx.type}
                        </Badge>
                      </td>
                      <td className="py-2 px-2">{tx.asset}</td>
                      <td className="font-bold py-2 px-2">
                        {tx.amount.toLocaleString()}
                      </td>
                      <td className="text-xs text-slate-500 py-2 px-2">
                        {tx.date} {tx.time}
                      </td>
                      <td className="py-2 px-2">
                        <Badge variant="outline" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                          ✓ {tx.status}
                        </Badge>
                      </td>
                      <td className="font-mono text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer py-2 px-2">
                        {tx.hash}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-slate-500">Total Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{transactions.length}</p>
              <p className="text-xs text-slate-500 mt-1">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-slate-500">Total Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                ${transactions.reduce((sum, tx) => sum + tx.amount, 0).toLocaleString()}
              </p>
              <p className="text-xs text-slate-500 mt-1">Moved this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-slate-500">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">100%</p>
              <p className="text-xs text-slate-500 mt-1">All transactions succeeded</p>
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
