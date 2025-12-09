"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { ArrowRightLeft, ChevronDown, Info, AlertCircle } from "lucide-react";

export default function BridgePage() {
  const t = useTranslations("bridge");
  const [fromChain, setFromChain] = useState("stellar");
  const [toChain, setToChain] = useState("ethereum");
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const chains = [
    {
      id: "stellar",
      name: "Stellar",
      icon: "⭐",
      balance: 1000,
      currency: "XLM",
      confirmations: 3,
    },
    {
      id: "ethereum",
      name: "Ethereum",
      icon: "Ξ",
      balance: 25.5,
      currency: "ETH",
      confirmations: 12,
    },
    {
      id: "polygon",
      name: "Polygon",
      icon: "◆",
      balance: 500,
      currency: "POL",
      confirmations: 128,
    },
  ];

  const bridges = [
    {
      id: "bridge-1",
      name: "Wormhole",
      fee: "0.1%",
      time: "5-10 min",
      status: "active",
    },
    {
      id: "bridge-2",
      name: "Stargate",
      fee: "0.3%",
      time: "2-5 min",
      status: "active",
    },
    {
      id: "bridge-3",
      name: "Reflector Network",
      fee: "0.05%",
      time: "30-60 sec",
      status: "active",
    },
  ];

  const recentBridges = [
    {
      id: "1",
      from: "Stellar",
      to: "Ethereum",
      amount: "500 XLM",
      value: "$62.50",
      status: "Completed",
      time: "2 hours ago",
      hash: "0xa1b2...",
    },
    {
      id: "2",
      from: "Ethereum",
      to: "Polygon",
      amount: "10 ETH",
      value: "$25,000",
      status: "Completed",
      time: "1 day ago",
      hash: "0xc3d4...",
    },
    {
      id: "3",
      from: "Polygon",
      to: "Stellar",
      amount: "1000 POL",
      value: "$750",
      status: "Completed",
      time: "3 days ago",
      hash: "0xe5f6...",
    },
  ];

  const handleSwapChains = () => {
    setFromChain(toChain);
    setToChain(fromChain);
  };

  const handleBridge = () => {
    if (!fromAmount) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setFromAmount("");
      setToAmount("");
    }, 2000);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const amount = e.target.value;
    setFromAmount(amount);
    // Simple conversion (in real app, would call price oracle)
    setToAmount((parseFloat(amount) * 0.95).toString());
  };

  const fromChainObj = chains.find((c) => c.id === fromChain);
  const toChainObj = chains.find((c) => c.id === toChain);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2">{t("title")}</h1>
          <p className="text-gray-400">Bridge tokens across different blockchains</p>
        </div>

        {/* Bridge Widget */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* From Chain */}
              <div>
                <label className="block text-sm font-medium mb-2">From Chain</label>
                <div className="relative">
                  <select
                    value={fromChain}
                    onChange={(e) => setFromChain(e.target.value)}
                    title="Select source chain"
                    aria-label="Select source chain"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                  >
                    {chains.map((chain) => (
                      <option key={chain.id} value={chain.id}>
                        {chain.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* From Amount */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">Amount</label>
                  <span className="text-xs text-gray-400">
                    Balance: {fromChainObj?.balance} {fromChainObj?.currency}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={fromAmount}
                    onChange={handleAmountChange}
                    placeholder="Enter amount"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                  <span className="absolute right-4 top-3 text-gray-400">
                    {fromChainObj?.currency}
                  </span>
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center">
                <button
                  onClick={handleSwapChains}
                  title="Swap source and destination chains"
                  aria-label="Swap chains"
                  className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
                >
                  <ArrowRightLeft className="w-6 h-6" />
                </button>
              </div>

              {/* To Chain */}
              <div>
                <label className="block text-sm font-medium mb-2">To Chain</label>
                <div className="relative">
                  <select
                    value={toChain}
                    onChange={(e) => setToChain(e.target.value)}
                    title="Select destination chain"
                    aria-label="Select destination chain"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                  >
                    {chains.map((chain) => (
                      <option key={chain.id} value={chain.id}>
                        {chain.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* To Amount */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">You will receive</label>
                  <span className="text-xs text-gray-400">
                    Balance: {toChainObj?.balance} {toChainObj?.currency}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={toAmount}
                    disabled
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white opacity-60 cursor-not-allowed"
                  />
                  <span className="absolute right-4 top-3 text-gray-400">
                    {toChainObj?.currency}
                  </span>
                </div>
              </div>

              {/* Bridge Selection */}
              <div>
                <label className="block text-sm font-medium mb-3">Bridge Protocol</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {bridges.map((bridge) => (
                    <div
                      key={bridge.id}
                      className="p-3 bg-slate-700 border border-slate-600 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
                    >
                      <p className="font-medium text-sm">{bridge.name}</p>
                      <div className="text-xs text-gray-400 mt-2 space-y-1">
                        <p>Fee: {bridge.fee}</p>
                        <p>Time: {bridge.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fees Summary */}
              <div className="bg-slate-700 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Bridge Fee</span>
                  <span>~0.1 {fromChainObj?.currency}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Network Fee</span>
                  <span>~0.05 {fromChainObj?.currency}</span>
                </div>
                <div className="border-t border-slate-600 pt-2 flex justify-between font-medium">
                  <span>Total Cost</span>
                  <span>~0.15 {fromChainObj?.currency}</span>
                </div>
              </div>

              {/* Bridge Button */}
              <Button
                onClick={handleBridge}
                disabled={!fromAmount || loading}
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600"
              >
                {loading ? "Bridging..." : "Bridge Tokens"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bridge Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Confirmation Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">2-5 min</p>
              <p className="text-xs text-gray-400 mt-1">Average bridge time</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Supported Chains
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{chains.length}</p>
              <p className="text-xs text-gray-400 mt-1">Select source destination</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">Min Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">$10</p>
              <p className="text-xs text-gray-400 mt-1">Minimum bridge value</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Bridges */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle>Recent Bridge Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentBridges.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">
                      {tx.from} → {tx.to}
                    </p>
                    <p className="text-sm text-gray-400">
                      {tx.amount} • {tx.value}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="bg-green-900 text-green-200 mb-1">
                      ✓ {tx.status}
                    </Badge>
                    <p className="text-xs text-gray-400">{tx.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Safety Info */}
        <Card className="bg-slate-800 border-slate-700 bg-opacity-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-1" />
              <div className="text-sm">
                <p className="font-medium mb-1">Safety Information</p>
                <p className="text-gray-400">
                  Always verify you're bridging to the correct destination address. Bridge transactions are
                  irreversible. Make sure to check fees and bridge protocols before proceeding.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
