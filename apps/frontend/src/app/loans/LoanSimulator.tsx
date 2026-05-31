'use client';

import { useMemo, useState } from 'react';

export interface LoanSimulatorProps {
  ltvBps: number; // e.g.: 6000 => 60%
  interestAprBps: number; // e.g.: 1500 => 15% annually
  wallet: { xlm: string; stlt?: string };
}

function currencyBRL(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'BRL' });
}

export default function LoanSimulator({ ltvBps, interestAprBps, wallet }: LoanSimulatorProps) {
  const [amount, setAmount] = useState<number>(5000);
  const [termMonths, setTermMonths] = useState<number>(6);
  const [collateralType, setCollateralType] = useState<'XLM' | 'STLT'>('XLM');
  const [feedback, setFeedback] = useState('');

  const apr = interestAprBps / 100; // % per year
  const monthlyRate = apr / 12 / 100; // monthly decimal rate

  // Price formula with compound interest (PMT)
  const monthlyPayment = useMemo(() => {
    if (monthlyRate === 0) return amount / termMonths;
    const r = monthlyRate;
    const n = termMonths;
    return (amount * r) / (1 - Math.pow(1 + r, -n));
  }, [amount, termMonths, monthlyRate]);

  const totalToPay = monthlyPayment * termMonths;
  const totalCost = totalToPay - amount;

  // Mock prices and LTV
  const prices = { XLM: 2.0, STLT: 1.0 }; // BRL per unit (mock)
  const maxLtv = ltvBps / 10000; // 0.6
  const collateralNeededUnits = (amount / (prices[collateralType] * maxLtv)) || 0;

  const walletAvailable = collateralType === 'XLM' ? Number(wallet?.xlm || 0) : Number(wallet?.stlt || 0);
  const hasCollateral = walletAvailable >= collateralNeededUnits;
  const maxBorrow = walletAvailable * prices[collateralType] * maxLtv;
  const nearLimit = hasCollateral && amount > 0.8 * maxBorrow; // gentle alert if near the limit

  function notify(msg: string) {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 3000);
  }

  function handleHire() {
    notify('Request sent (mock). You will be redirected for confirmation and collateral deposit.');
  }

  return (
    <div className="space-y-4">
      {feedback && (
        <div role="status" className="rounded-md border border-primary/30 bg-primary/10 p-3 text-primary">{feedback}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">Desired amount (BRL)</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Math.max(100, Number(e.target.value)))}
            className="rounded bg-secondary/30 border border-border/60 p-2 text-foreground"
            min={100}
            step={50}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">Term</span>
          <select
            value={termMonths}
            onChange={(e) => setTermMonths(Number(e.target.value))}
            className="rounded bg-secondary/30 border border-border/60 p-2 text-foreground"
          >
            {[3, 6, 9, 12, 18, 24].map((m) => (
              <option key={m} value={m}>{m} months</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-muted-foreground">Collateral</span>
          <select
            value={collateralType}
            onChange={(e) => setCollateralType(e.target.value as 'XLM' | 'STLT')}
            className="rounded bg-secondary/30 border border-border/60 p-2 text-foreground"
          >
            <option value="XLM">XLM</option>
            <option value="STLT">STLT</option>
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-4 text-sm">
        <div>
          <div className="text-muted-foreground">Monthly interest (CET)</div>
          <div className="text-foreground">{(monthlyRate * 100).toFixed(2)}%</div>
        </div>
        <div>
          <div className="text-muted-foreground">Annual interest (APR)</div>
          <div className="text-foreground">{apr.toFixed(2)}%</div>
        </div>
        <div>
          <div className="text-muted-foreground">Estimated installment</div>
          <div className="text-foreground">{currencyBRL(monthlyPayment)}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Total to pay</div>
          <div className="text-foreground">{currencyBRL(totalToPay)}</div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 text-sm">
        <div>
          <div className="text-muted-foreground">Required collateral</div>
          <div className="text-foreground">{collateralNeededUnits.toFixed(2)} {collateralType}</div>
          <div className="text-xs text-muted-foreground">Mock price: {currencyBRL(prices[collateralType])} / {collateralType}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Your balance</div>
          <div className="text-foreground">{walletAvailable.toLocaleString('en-US')} {collateralType}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Total cost</div>
          <div className="text-foreground">{currencyBRL(totalCost)}</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className={`rounded border p-3 text-sm ${!hasCollateral ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'border-primary/30 bg-primary/10 text-primary'}`}>
          {!hasCollateral
            ? 'You do not have enough collateral balance (mock). Consider reducing the amount or changing the asset.'
            : 'Warning: If the collateral value falls due to market conditions, the loan may be automatically liquidated.'}
        </div>
        {nearLimit && (
          <div className="rounded border border-primary/30 bg-primary/10 p-3 text-primary text-sm">
            You are close to the maximum supported by your collateral. Consider reducing the amount to avoid liquidation risk.
          </div>
        )}
        <div className="text-sm text-primary underline cursor-pointer" onClick={() => setFeedback('Opening LTV explanation (mock)...')}>
          Learn more about liquidation risk
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFeedback('Simulation updated.')}
          className="px-4 py-2 rounded bg-secondary/30 border border-border/60 text-foreground text-sm"
        >
          Simulate
        </button>
        <button
          onClick={handleHire}
          disabled={!hasCollateral}
          className={`px-4 py-2 rounded text-sm ${hasCollateral ? 'bg-primary text-primary-foreground' : 'bg-secondary/20 border border-border/60 text-muted-foreground cursor-not-allowed'}`}
          title={hasCollateral ? 'Start loan' : 'Insufficient collateral balance'}
        >
          Start Loan
        </button>
      </div>
    </div>
  );
}
