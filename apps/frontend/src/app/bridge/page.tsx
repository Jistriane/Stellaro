"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
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
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <Image src="/capa.png" alt="Stellaro background" fill priority sizes="100vw" className="object-cover object-center opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/92 to-background/75" />
      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-8 p-6">
        <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold mb-1">{t("title")}</h1>
          <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
        </div>

        {/* Bridge Widget */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* From Chain */}
              <div>
                <label className="block text-xs font-medium mb-2 text-muted-foreground">From Chain</label>
                <div className="relative">
                  <select
                    value={fromChain}
                    onChange={(e) => setFromChain(e.target.value)}
                    title="Select source chain"
                    aria-label="Select source chain"
                    className="w-full px-4 py-3 bg-secondary/30 border border-border/60 rounded-lg text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 appearance-none cursor-pointer"
                  >
                    {chains.map((chain) => (
                      <option key={chain.id} value={chain.id}>
                        {chain.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* From Amount */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs font-medium text-muted-foreground">{t("amount")}</label>
                  <span className="text-xs text-muted-foreground">
                    Balance: {fromChainObj?.balance} {fromChainObj?.currency}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={fromAmount}
                    onChange={handleAmountChange}
                    placeholder="Enter amount"
                    className="w-full px-4 py-3 bg-secondary/30 border border-border/60 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20"
                  />
                  <span className="absolute right-4 top-3 text-muted-foreground">
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
                  className="p-2 bg-primary hover:bg-primary/90 rounded-full transition-colors"
                >
                  <ArrowRightLeft className="w-6 h-6" />
                </button>
              </div>

              {/* To Chain */}
              <div>
                <label className="block text-xs font-medium mb-2 text-muted-foreground">To Chain</label>
                <div className="relative">
                  <select
                    value={toChain}
                    onChange={(e) => setToChain(e.target.value)}
                    title="Select destination chain"
                    aria-label="Select destination chain"
                    className="w-full px-4 py-3 bg-secondary/30 border border-border/60 rounded-lg text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 appearance-none cursor-pointer"
                  >
                    {chains.map((chain) => (
                      <option key={chain.id} value={chain.id}>
                        {chain.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* To Amount */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs font-medium text-muted-foreground">{t("you_will_receive")}</label>
                  <span className="text-xs text-muted-foreground">
                    Balance: {toChainObj?.balance} {toChainObj?.currency}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={toAmount}
                    disabled
                    title="Amount to receive"
                    aria-label="You will receive"
                    className="w-full px-4 py-3 bg-secondary/20 border border-border/60 rounded-lg text-foreground opacity-60 cursor-not-allowed"
                  />
                  <span className="absolute right-4 top-3 text-muted-foreground">
                    {toChainObj?.currency}
                  </span>
                </div>
              </div>

              {/* Bridge Selection */}
              <div>
                <label className="block text-xs font-medium mb-3 text-muted-foreground">{t("bridge_protocol")}</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {bridges.map((bridge) => (
                    <div
                      key={bridge.id}
                      className="p-3 bg-secondary/20 border border-border/60 rounded-lg cursor-pointer hover:border-primary/40 transition-colors"
                    >
                      <p className="font-medium text-sm text-foreground">{bridge.name}</p>
                      <div className="text-xs text-muted-foreground mt-2 space-y-1">
                        <p>Fee: {bridge.fee}</p>
                        <p>Time: {bridge.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fees Summary */}
              <div className="bg-secondary/20 p-4 rounded-lg space-y-2 border border-border/60">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("bridge_fee")}</span>
                  <span className="text-foreground">~0.1 {fromChainObj?.currency}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("network_fee")}</span>
                  <span className="text-foreground">~0.05 {fromChainObj?.currency}</span>
                </div>
                <div className="border-t border-border/60 pt-2 flex justify-between font-medium">
                  <span className="text-foreground">{t("total_cost")}</span>
                  <span className="text-foreground">~0.15 {fromChainObj?.currency}</span>
                </div>
              </div>

              {/* Bridge Button */}
              <Button
                onClick={handleBridge}
                disabled={!fromAmount || loading}
                size="lg"
                className="w-full"
              >
                {loading ? t("bridging") : t("bridge_button")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bridge Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Info className="w-4 h-4" />
                {t("confirmation_time")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">2-5 min</p>
              <p className="text-xs text-muted-foreground mt-1">{t("average_bridge_time")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {t("supported_chains")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{chains.length}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("select_source_destination")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{t("min_amount")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">$10</p>
              <p className="text-xs text-muted-foreground mt-1">{t("minimum_bridge_value")}</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Bridges */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">{t("recent_bridge_transactions")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentBridges.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-border/60">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {tx.from} → {tx.to}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {tx.amount} • {tx.value}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="mb-1 text-primary">
                      ✓ {tx.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground">{tx.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Safety Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
              <div className="text-sm">
                <p className="font-medium mb-1 text-foreground">{t("safety_information")}</p>
                <p className="text-muted-foreground">
                  {t("safety_message")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
