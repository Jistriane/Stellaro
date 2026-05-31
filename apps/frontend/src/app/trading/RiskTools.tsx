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
          <span className="text-muted-foreground">Entry ({quote})</span>
          <input type="number" step={1} value={entry} onChange={(e) => setEntry(Number(e.target.value))} className="rounded bg-secondary/30 border border-border/60 p-2 text-foreground" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-muted-foreground">Qty ({base})</span>
          <input type="number" step={0.0001} value={qty} onChange={(e) => setQty(Number(e.target.value))} className="rounded bg-secondary/30 border border-border/60 p-2 text-foreground" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-muted-foreground">Stop loss ({quote})</span>
          <input type="number" step={1} value={stop} onChange={(e) => setStop(Number(e.target.value))} className="rounded bg-secondary/30 border border-border/60 p-2 text-foreground" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-muted-foreground">Take profit ({quote})</span>
          <input type="number" step={1} value={take} onChange={(e) => setTake(Number(e.target.value))} className="rounded bg-secondary/30 border border-border/60 p-2 text-foreground" />
        </label>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <div className="text-muted-foreground">Risk</div>
          <div className="text-foreground">{fmt(Math.max(0, riskBRL))}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Reward</div>
          <div className="text-foreground">{fmt(Math.max(0, rewardBRL))}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Risk/Reward</div>
          <div className="text-foreground">{rr}</div>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">Tip: keep RR ≥ 1.5:1. Set stop and take directly when sending the order.</div>
    </div>
  );
}
