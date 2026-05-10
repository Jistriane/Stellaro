"use client";

import Image from "next/image";
import { Droplet, Plus, ArrowDownToLine } from "lucide-react";

export default function LiquidityManagePage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 px-4 py-6 sm:px-6 lg:px-8">
      <Image src="/capa.png" alt="Stellaro background" fill priority sizes="100vw" className="object-cover object-center opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/92 to-slate-900/78" />
      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-8 p-6">
        <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Droplet className="w-8 h-8 text-blue-500" />
              Liquidity Management
            </h1>
            <p className="text-slate-400 mt-2">Add or remove liquidity from Stellaro pools.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors">
            <Plus className="w-4 h-4" /> New Position
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Mock pool card */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">STLT-BRL / XLM</h3>
                <p className="text-sm text-slate-400">Fee: 0.3%</p>
              </div>
              <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-bold">
                12.5% APY
              </div>
            </div>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">TVL</span>
                <span className="text-white font-mono">$1,240,500</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Your Position</span>
                <span className="text-white font-mono">$0.00</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg font-medium transition-colors">
                <Plus className="w-4 h-4" /> Deposit
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-lg font-medium transition-colors">
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
