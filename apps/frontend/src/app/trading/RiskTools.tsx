'use client';

import { useMemo, useState } from 'react';

export default function RiskTools({ priceRef = 270000, base = 'BTC', quote = 'BRL' }: { priceRef?: number; base?: string; quote?: string }) {
  const [entry, setEntry] = useState<number>(priceRef);
  const [qty, setQty] = useState<number>(0.01);
  const [stop, setStop] = useState<number>(priceRef * 0.97);
  const [take, setTake] = useState<number>(priceRef * 1.03);

  const riskBRL = useMemo(() => (entry - stop) * qty, [entry, stop, qty]);
  const rewardBRL = useMemo(() => (take - entry) * qty, [entry, take, qty]);

  function fmt(v: number) {
    return v.toLocaleString('en-US', { style: 'currency', currency: 'BRL' });
  }

  const rr = useMemo(() => {
    if (riskBRL <= 0) return '—';
    return (rewardBRL / riskBRL).toFixed(2) + ':1';
  }, [riskBRL, rewardBRL]);

  return (
    <div className="space-y-3 text-sm">
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-slate-400">Entry ({quote})</span>
          <input type="number" step={1} value={entry} onChange={(e) => setEntry(Number(e.target.value))} className="rounded bg-slate-900/50 border border-slate-800 p-2" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-slate-400">Qty ({base})</span>
          <input type="number" step={0.0001} value={qty} onChange={(e) => setQty(Number(e.target.value))} className="rounded bg-slate-900/50 border border-slate-800 p-2" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-slate-400">Stop loss ({quote})</span>
          <input type="number" step={1} value={stop} onChange={(e) => setStop(Number(e.target.value))} className="rounded bg-slate-900/50 border border-slate-800 p-2" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-slate-400">Take profit ({quote})</span>
          <input type="number" step={1} value={take} onChange={(e) => setTake(Number(e.target.value))} className="rounded bg-slate-900/50 border border-slate-800 p-2" />
        </label>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <div className="text-slate-400">Risk</div>
          <div className="text-slate-200">{fmt(Math.max(0, riskBRL))}</div>
        </div>
        <div>
          <div className="text-slate-400">Reward</div>
          <div className="text-slate-200">{fmt(Math.max(0, rewardBRL))}</div>
        </div>
        <div>
          <div className="text-slate-400">Risk/Reward</div>
          <div className="text-slate-200">{rr}</div>
        </div>
      </div>

      <div className="text-xs text-slate-500">Tip: keep RR ≥ 1.5:1. Set stop and take directly when sending the order.</div>
    </div>
  );
}
