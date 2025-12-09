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
      {feedback && <div className="rounded border border-emerald-300 bg-emerald-900/10 text-emerald-300 text-xs p-2">{feedback}</div>}

      <div className="flex gap-2">
        <button className={`px-3 py-1 rounded text-sm ${side === 'BUY' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-200'}`} onClick={() => setSide('BUY')}>Buy</button>
        <button className={`px-3 py-1 rounded text-sm ${side === 'SELL' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-200'}`} onClick={() => setSide('SELL')}>Sell</button>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <label htmlFor="order-type">Type:</label>
        <select
          id="order-type"
          title="Select order type"
          aria-label="Select order type"
          value={type}
          onChange={(e) => setType(e.target.value as OrderType)}
          className="bg-slate-900/50 border border-slate-800 rounded px-2 py-1"
        >
          <option value="LIMIT">Limit</option>
          <option value="MARKET">Market</option>
          <option value="STOP">Stop</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Qty ({base})</span>
          <input type="number" step={0.0001} value={qty} onChange={(e) => setQty(Number(e.target.value))} className="rounded bg-slate-900/50 border border-slate-800 p-2" />
        </label>
        {type !== 'MARKET' && (
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-400">Price ({quote})</span>
            <input type="number" step={1} value={price} onChange={(e) => setPrice(Number(e.target.value))} className="rounded bg-slate-900/50 border border-slate-800 p-2" />
          </label>
        )}
        {type === 'STOP' && (
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-400">Stop ({quote})</span>
            <input type="number" step={1} value={stop} onChange={(e) => setStop(Number(e.target.value))} className="rounded bg-slate-900/50 border border-slate-800 p-2" />
          </label>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-slate-400">Total</div>
          <div className="text-slate-200">{formatBRL(total)}</div>
        </div>
        <div>
          <div className="text-slate-400">Estimated fee</div>
          <div className="text-slate-200">{formatBRL(feeValue)}</div>
        </div>
      </div>

      <div className="text-xs text-slate-500">Balance {base}: {balances[base]} • Balance {quote}: {formatBRL(balances[quote])}</div>

      <div className="flex gap-2">
        <button className="px-4 py-2 rounded bg-slate-800 text-slate-100 text-sm" onClick={() => note('Order preview (mock).')}>Preview</button>
        <button className={`px-4 py-2 rounded text-sm ${side === 'BUY' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`} onClick={submit}>{side === 'BUY' ? 'Buy' : 'Sell'}</button>
      </div>

      <div className="text-xs text-slate-500">Dual confirmation is enabled for your security (mock).</div>
    </div>
  );
}
