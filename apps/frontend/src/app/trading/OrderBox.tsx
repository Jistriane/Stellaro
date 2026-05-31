'use client';

import { useMemo, useState } from 'react';

type OrderType = 'LIMIT' | 'MARKET' | 'STOP';

type Side = 'BUY' | 'SELL';

export default function OrderBox({ base = 'BTC', quote = 'BRL', priceRef = 270000 }: { base?: string; quote?: string; priceRef?: number }) {
  const [side, setSide] = useState<Side>('BUY');
  const [type, setType] = useState<OrderType>('LIMIT');
  const [qty, setQty] = useState<number>(0.01);
  const [price, setPrice] = useState<number>(priceRef);
  const [stop, setStop] = useState<number>(priceRef * 0.98);
  const [feedback, setFeedback] = useState<string>('');

  const fee = 0.001; // 0.1% mock

  const total = useMemo(() => {
    const p = type === 'MARKET' ? priceRef : price;
    return p * qty;
  }, [qty, price, type, priceRef]);

  const feeValue = total * fee;

  const balances = {
    [base]: 0.027,
    [quote]: 1230,
  } as Record<string, number>;

  function submit() {
    // minimal validations
    if (qty <= 0) return note('Invalid quantity.');
    if (type !== 'MARKET' && price <= 0) return note('Invalid price.');
    if (type === 'STOP' && stop <= 0) return note('Invalid stop price.');
    note(`${side === 'BUY' ? 'Buy' : 'Sell'} ${qty} ${base} ${type === 'MARKET' ? 'at market' : `@ ${formatBRL(price)}`} sent (mock).`);
  }

  function note(msg: string) {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 3000);
  }

  function formatBRL(v: number) {
    return v.toLocaleString('en-US', { style: 'currency', currency: 'BRL' });
  }

  return (
    <div className="space-y-3">
      {feedback && <div className="rounded-xl border border-primary/30 bg-primary/10 text-foreground text-xs p-2">{feedback}</div>}

      <div className="flex gap-2">
        <button className={`px-3 py-1 rounded text-sm ${side === 'BUY' ? 'bg-primary text-primary-foreground' : 'bg-secondary/30 border border-border/60 text-foreground'}`} onClick={() => setSide('BUY')}>Buy</button>
        <button className={`px-3 py-1 rounded text-sm ${side === 'SELL' ? 'bg-destructive text-destructive-foreground' : 'bg-secondary/30 border border-border/60 text-foreground'}`} onClick={() => setSide('SELL')}>Sell</button>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <label htmlFor="order-type">Type:</label>
        <select
          id="order-type"
          title="Select order type"
          aria-label="Select order type"
          value={type}
          onChange={(e) => setType(e.target.value as OrderType)}
          className="bg-secondary/30 border border-border/60 rounded px-2 py-1 text-foreground"
        >
          <option value="LIMIT">Limit</option>
          <option value="MARKET">Market</option>
          <option value="STOP">Stop</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Qty ({base})</span>
          <input type="number" step={0.0001} value={qty} onChange={(e) => setQty(Number(e.target.value))} className="rounded bg-secondary/30 border border-border/60 p-2 text-foreground" />
        </label>
        {type !== 'MARKET' && (
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Price ({quote})</span>
            <input type="number" step={1} value={price} onChange={(e) => setPrice(Number(e.target.value))} className="rounded bg-secondary/30 border border-border/60 p-2 text-foreground" />
          </label>
        )}
        {type === 'STOP' && (
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Stop ({quote})</span>
            <input type="number" step={1} value={stop} onChange={(e) => setStop(Number(e.target.value))} className="rounded bg-secondary/30 border border-border/60 p-2 text-foreground" />
          </label>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-muted-foreground">Total</div>
          <div className="text-foreground">{formatBRL(total)}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Estimated fee</div>
          <div className="text-foreground">{formatBRL(feeValue)}</div>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">Balance {base}: {balances[base]} • Balance {quote}: {formatBRL(balances[quote])}</div>

      <div className="flex gap-2">
        <button className="px-4 py-2 rounded bg-secondary/30 border border-border/60 text-foreground text-sm" onClick={() => note('Order preview (mock).')}>Preview</button>
        <button className={`px-4 py-2 rounded text-sm ${side === 'BUY' ? 'bg-primary text-primary-foreground' : 'bg-destructive text-destructive-foreground'}`} onClick={submit}>{side === 'BUY' ? 'Buy' : 'Sell'}</button>
      </div>

      <div className="text-xs text-muted-foreground">Dual confirmation is enabled for your security (mock).</div>
    </div>
  );
}
