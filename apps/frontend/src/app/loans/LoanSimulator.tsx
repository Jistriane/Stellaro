'use client';

import { useMemo, useState } from 'react';

export interface LoanSimulatorProps {
  ltvBps: number; // ex.: 6000 => 60%
  interestAprBps: number; // ex.: 1500 => 15% a.a.
  wallet: { xlm: string; stlt?: string };
}

function currencyBRL(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function LoanSimulator({ ltvBps, interestAprBps, wallet }: LoanSimulatorProps) {
  const [amount, setAmount] = useState<number>(5000);
  const [termMonths, setTermMonths] = useState<number>(6);
  const [collateralType, setCollateralType] = useState<'XLM' | 'STLT'>('XLM');
  const [feedback, setFeedback] = useState('');

  const apr = interestAprBps / 100; // % a.a.
  const monthlyRate = apr / 12 / 100; // decimal ao mês

  // Fórmula preço com juros compostos (PMT)
  const monthlyPayment = useMemo(() => {
    if (monthlyRate === 0) return amount / termMonths;
    const r = monthlyRate;
    const n = termMonths;
    return (amount * r) / (1 - Math.pow(1 + r, -n));
  }, [amount, termMonths, monthlyRate]);

  const totalToPay = monthlyPayment * termMonths;
  const totalCost = totalToPay - amount;

  // Mock de preços e LTV
  const prices = { XLM: 2.0, STLT: 1.0 }; // BRL por unidade (mock)
  const maxLtv = ltvBps / 10000; // 0.6
  const collateralNeededUnits = (amount / (prices[collateralType] * maxLtv)) || 0;

  const walletAvailable = collateralType === 'XLM' ? Number(wallet?.xlm || 0) : Number(wallet?.stlt || 0);
  const hasCollateral = walletAvailable >= collateralNeededUnits;
  const maxBorrow = walletAvailable * prices[collateralType] * maxLtv;
  const nearLimit = hasCollateral && amount > 0.8 * maxBorrow; // alerta suave se próximo do limite

  function notify(msg: string) {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 3000);
  }

  function handleHire() {
    notify('Solicitação enviada (mock). Você será direcionado para confirmação e envio de garantia.');
  }

  return (
    <div className="space-y-4">
      {feedback && (
        <div role="status" className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-emerald-700">{feedback}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-400">Valor desejado (R$)</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Math.max(100, Number(e.target.value)))}
            className="rounded bg-slate-900/50 border border-slate-800 p-2 text-slate-100"
            min={100}
            step={50}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-400">Prazo</span>
          <select
            value={termMonths}
            onChange={(e) => setTermMonths(Number(e.target.value))}
            className="rounded bg-slate-900/50 border border-slate-800 p-2 text-slate-100"
          >
            {[3, 6, 9, 12, 18, 24].map((m) => (
              <option key={m} value={m}>{m} meses</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-400">Garantia</span>
          <select
            value={collateralType}
            onChange={(e) => setCollateralType(e.target.value as 'XLM' | 'STLT')}
            className="rounded bg-slate-900/50 border border-slate-800 p-2 text-slate-100"
          >
            <option value="XLM">XLM</option>
            <option value="STLT">STLT</option>
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-4 text-sm">
        <div>
          <div className="text-slate-400">Juros ao mês (CET)</div>
          <div className="text-slate-200">{(monthlyRate * 100).toFixed(2)}%</div>
        </div>
        <div>
          <div className="text-slate-400">Juros ao ano (APR)</div>
          <div className="text-slate-200">{apr.toFixed(2)}%</div>
        </div>
        <div>
          <div className="text-slate-400">Parcela estimada</div>
          <div className="text-slate-200">{currencyBRL(monthlyPayment)}</div>
        </div>
        <div>
          <div className="text-slate-400">Total a pagar</div>
          <div className="text-slate-200">{currencyBRL(totalToPay)}</div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 text-sm">
        <div>
          <div className="text-slate-400">Garantia necessária</div>
          <div className="text-slate-200">{collateralNeededUnits.toFixed(2)} {collateralType}</div>
          <div className="text-xs text-slate-500">Preço mock: {currencyBRL(prices[collateralType])} / {collateralType}</div>
        </div>
        <div>
          <div className="text-slate-400">Seu saldo</div>
          <div className="text-slate-200">{walletAvailable.toLocaleString('pt-BR')} {collateralType}</div>
        </div>
        <div>
          <div className="text-slate-400">Custo total</div>
          <div className="text-slate-200">{currencyBRL(totalCost)}</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className={`rounded border p-3 text-sm ${!hasCollateral ? 'border-rose-300 bg-rose-50 text-rose-800' : 'border-amber-300 bg-amber-50 text-amber-800'}`}>
          {!hasCollateral
            ? 'Você não possui saldo suficiente para garantia (mock). Considere reduzir o valor ou alterar o ativo.'
            : 'Atenção: Se o valor da garantia cair devido ao mercado, o empréstimo pode ser liquidado automaticamente.'}
        </div>
        {nearLimit && (
          <div className="rounded border border-amber-300 bg-amber-50 p-3 text-amber-800 text-sm">
            Você está próximo do limite máximo suportado pela sua garantia. Considere reduzir o valor para evitar risco de liquidação.
          </div>
        )}
        <div className="text-sm text-indigo-400 underline cursor-pointer" onClick={() => setFeedback('Abrindo explicação de LTV (mock)...')}>
          Saiba mais sobre risco de liquidação
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFeedback('Simulação atualizada.')}
          className="px-4 py-2 rounded bg-slate-800 text-slate-100 text-sm"
        >
          Simular
        </button>
        <button
          onClick={handleHire}
          disabled={!hasCollateral}
          className={`px-4 py-2 rounded text-sm ${hasCollateral ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 cursor-not-allowed'}`}
          title={hasCollateral ? 'Contratar empréstimo' : 'Saldo insuficiente para garantia'}
        >
          Contratar Empréstimo
        </button>
      </div>
    </div>
  );
}
