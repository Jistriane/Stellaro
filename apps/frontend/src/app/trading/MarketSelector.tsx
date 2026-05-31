'use client';

import { useMemo, useState } from 'react';

const PAIRS = [
  { symbol: 'BTC/BRL', change24h: 2.43, volume24h: 12000000 },
  { symbol: 'ETH/BRL', change24h: -1.1, volume24h: 4200000 },
  { symbol: 'STLT/USDT', change24h: 0.8, volume24h: 860000 },
  { symbol: 'XLM/BRL', change24h: 3.2, volume24h: 1300000 },
];

export default function MarketSelector({ onChange }: { onChange?: (pair: string) => void }) {
  const [pair, setPair] = useState('BTC/BRL');
  const selected = useMemo(() => PAIRS.find(p => p.symbol === pair)!, [pair]);

  function handle(pair: string) {
    setPair(pair);
    onChange?.(pair);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <label className="text-sm text-muted-foreground" htmlFor="market-selector">Market:</label>
        <select
          id="market-selector"
          title="Select trading pair"
          aria-label="Select trading pair"
          value={pair}
          onChange={(e) => handle(e.target.value)}
          className="bg-secondary/30 border border-border/60 rounded px-2 py-1 text-sm text-foreground"
        >
          {PAIRS.map(p => (
            <option key={p.symbol} value={p.symbol}>{p.symbol}</option>
          ))}
        </select>
        <div className={`text-xs ${selected.change24h >= 0 ? 'text-primary' : 'text-destructive'}`}>24h: {selected.change24h >= 0 ? '+' : ''}{selected.change24h}%</div>
        <div className="text-xs text-muted-foreground">Volume: {selected.volume24h.toLocaleString('en-US', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</div>
      </div>
      <div className="text-xs text-muted-foreground">Warning: trading involves risk. Do not invest more than you can afford to lose.</div>
    </div>
  );
}
