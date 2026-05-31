"use client";

import Image from "next/image";
import { Droplet, Plus, ArrowDownToLine } from "lucide-react";

export default function LiquidityManagePage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <Image src="/capa.png" alt="Stellaro background" fill priority sizes="100vw" className="object-cover object-center opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/85 to-background/60" />
      <div className="absolute inset-0 bg-[radial-gradient(1000px_circle_at_20%_15%,rgba(var(--stellaro-accent-rgb),0.14),transparent_60%),radial-gradient(900px_circle_at_80%_10%,rgba(197,135,230,0.10),transparent_55%)]" />
      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-8 p-6">
        <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Droplet className="w-8 h-8 text-primary" />
              Liquidity Management
            </h1>
            <p className="text-muted-foreground mt-2">Add or remove liquidity from Stellaro pools.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-medium transition-colors">
            <Plus className="w-4 h-4" /> New Position
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Mock pool card */}
          <div className="bg-card/50 border border-border/60 rounded-2xl p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">STLT-BRL / XLM</h3>
                <p className="text-sm text-muted-foreground">Fee: 0.3%</p>
              </div>
              <div className="px-3 py-1 bg-primary/10 border border-primary/25 text-primary rounded-full text-xs font-bold">
                12.5% APY
              </div>
            </div>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">TVL</span>
                <span className="text-foreground font-mono">$1,240,500</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Your Position</span>
                <span className="text-foreground font-mono">$0.00</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary/10 border border-primary/25 text-primary hover:bg-primary/15 rounded-lg font-medium transition-colors">
                <Plus className="w-4 h-4" /> Deposit
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-secondary/30 border border-border/60 text-foreground hover:bg-secondary/40 rounded-lg font-medium transition-colors">
                <ArrowDownToLine className="w-4 h-4" /> Withdraw
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
