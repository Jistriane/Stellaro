'use client';

import { useMemo, useState } from 'react';

export type CoverageKey = 'balance' | 'card' | 'cyber' | 'defi';

const COVERAGES: Record<CoverageKey, { label: string; base: number; desc: string }> = {
  balance: { label: 'Balance/Token', base: 6.99, desc: 'Protection against digital fraud/theft' },
  card: { label: 'Card', base: 4.99, desc: 'Unrecognized transactions, loss/theft' },
  cyber: { label: 'Cyber', base: 9.99, desc: 'Personal attacks/hacks' },
  defi: { label: 'DeFi (Beta)', base: 14.99, desc: 'Pools, staking, contracts' },
};

export default function InsuranceSimulator() {
  const [amount, setAmount] = useState<number>(2000); // desired covered value (BRL)
  const [yearly, setYearly] = useState<boolean>(false);
  const [selected, setSelected] = useState<Record<CoverageKey, boolean>>({ balance: true, card: false, cyber: false, defi: false });
  const [feedback, setFeedback] = useState('');

  const baseMonthly = useMemo(() => {
    let total = 0;
    Object.entries(selected).forEach(([k, v]) => {
      if (v) total += COVERAGES[k as CoverageKey].base;
    });
    // factor by value covered: +1% per BRL 1000 above BRL 1000 (simple mock)
    const factor = Math.max(1, 1 + Math.max(0, amount - 1000) / 1000 * 0.01);
    return total * factor;
  }, [selected, amount]);

  const premium = yearly ? baseMonthly * 12 * 0.9 : baseMonthly; // 10% off annual (mock)

  function toggle(cov: CoverageKey) {
    setSelected((s) => ({ ...s, [cov]: !s[cov] }));
  }

  function notify(msg: string) {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 3000);
  }

  return (
    <div className="space-y-4">
      {feedback && (
        <div role="status" className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-emerald-700 text-sm">{feedback}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-400">Desired coverage amount (BRL)</span>
          <input
            type="number"
            min={500}
            step={100}
            value={amount}
            onChange={(e) => setAmount(Math.max(500, Number(e.target.value)))}
            className="rounded bg-slate-900/50 border border-slate-800 p-2 text-slate-100"
          />
        </label>
        <div className="flex flex-col gap-1">
          <span className="text-sm text-slate-400">Coverages</span>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(COVERAGES).map(([key, cfg]) => (
              <label key={key} className="flex items-center gap-2 bg-slate-900/50 border border-slate-800 rounded p-2 text-sm">
                <input type="checkbox" checked={selected[key as CoverageKey]} onChange={() => toggle(key as CoverageKey)} />
                <span>{cfg.label}</span>
              </label>
            ))}
          </div>
        </div>
        <label className="flex items-end gap-2">
          <input type="checkbox" checked={yearly} onChange={(e) => setYearly(e.target.checked)} />
          <span className="text-sm">Annual payment (10% off)</span>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 text-sm">
        <div>
          <div className="text-slate-400">Estimated {yearly ? 'annual' : 'monthly'} premium</div>
          <div className="text-slate-200">{premium.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
        </div>
        <div>
          <div className="text-slate-400">Selected coverage</div>
          <div className="text-slate-200">{Object.entries(selected).filter(([, v]) => v).map(([k]) => COVERAGES[k as CoverageKey].label).join(', ') || 'None'}</div>
        </div>
        <div>
          <div className="text-slate-400">Deductible (mock)</div>
          <div className="text-slate-200">{(amount * 0.05).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button className="px-4 py-2 rounded bg-slate-800 text-slate-100 text-sm" onClick={() => notify('Simulation updated.')}>Simulate</button>
        <button className="px-4 py-2 rounded bg-emerald-600 text-white text-sm" onClick={() => notify('Proposal submitted (mock).')}>Purchase</button>
      </div>

      <div className="text-xs text-slate-500">Illustrative values. Read the general conditions before contracting.</div>
    </div>
  );
}
