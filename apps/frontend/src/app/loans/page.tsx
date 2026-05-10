"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getContractIds, viewLoansPool, getWalletBalances } from "@/lib/soroban";
import LoanSimulator from "./LoanSimulator";
import { useTranslations } from "next-intl";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";
import { useEffect, useState } from "react";

export default function LoansPage() {
  const t = useTranslations("loans");
  const tc = useTranslations("common");
  
  // Enable real-time updates when the wallet connects
  useRealTimeUpdates();
  
  const [data, setData] = useState<{
    pool: any;
    wallet: any;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadData() {
      const ids = getContractIds();
      const [pool, wallet] = await Promise.all([
        viewLoansPool(),
        getWalletBalances(),
      ]);
      
      setData({ pool, wallet });
      setLoading(false);
    }
    
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center">
          <div className="text-slate-400">Loading...</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center">
          <div className="text-slate-400">Error loading data</div>
        </div>
      </div>
    );
  }

  const { pool, wallet } = data;
  const ids = getContractIds();

  // Mock active user loans
  const activeLoans = [
    {
      id: "L-001",
      date: "2025-08-12",
      principal: 5000,
      currency: "BRL",
      collateralXLM: 300,
      balanceDue: 2890,
      interest_apr_bps: pool.interest_bps ?? 0, // use pool as reference with fallback
      dueInDays: 12,
      status: "Up to Date",
    },
    {
      id: "L-002",
      date: "2025-07-10",
      principal: 1000,
      currency: "USD",
      collateralXLM: 150,
      balanceDue: 450,
      interest_apr_bps: pool.interest_bps ?? 0,
      dueInDays: 2,
      status: "Next Due",
    },
  ];

  // History (paid off/liquidated)
  const historyLoans = [
    { id: "H-101", start: "2025-06-01", amount: 800, paidAt: "2025-06-28", status: "Paid" },
  ];

  const ltvPct = ((pool.ltv_bps ?? 0) / 100).toFixed(0); // friendly display
  const interestPct = ((pool.interest_bps ?? 0) / 100).toFixed(2);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 px-4 py-6 sm:px-6 lg:px-8">
      <Image src="/capa.png" alt="Stellaro background" fill priority sizes="100vw" className="object-cover object-center opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/92 to-slate-900/78" />
      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-8 p-6">
      {/* Title and timestamp */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("header.title")}</h1>
        <div className="text-xs text-slate-500">{t("header.updated_now")}</div>
      </div>

      {/* Introduction and warnings */}
      <Card>
        <CardHeader>
          <CardTitle>{t("intro.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-300">{t("intro.p1")}</p>
          <div className="mt-3 rounded border border-amber-300 bg-amber-50/10 p-3 text-amber-300 text-xs">
            {t("intro.responsibility")}
          </div>
        </CardContent>
      </Card>

      {/* Pool Summary / Parameters */}
      <Card>
        <CardHeader>
          <CardTitle>{t("pool.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-slate-400">{t("pool.contract")}</div>
          <div className="truncate mb-2 text-slate-200">{ids.LOANSPOOL_CONTRACT_ID || "—"}</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>{t("pool.ltv_max")}: <b>{ltvPct}%</b></div>
            <div>{t("pool.apr")}: <b>{interestPct}%</b></div>
            <div>{t("pool.accounts")}: <b>{pool.accounts}</b></div>
            <div>{t("pool.total_deposits")}: <b>{pool.total_deposits}</b></div>
            <div>{t("pool.total_borrowed")}: <b>{pool.total_borrowed}</b></div>
          </div>
        </CardContent>
      </Card>

      {/* Active Loans */}
      <Card>
        <CardHeader>
          <CardTitle>{t("active.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {activeLoans.length === 0 ? (
            <div className="text-sm text-slate-400">{t("active.none")}</div>
          ) : (
            <div className="space-y-3">
              {activeLoans.map((l) => (
                <div key={l.id} className="rounded bg-slate-900 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm">
                      <div className="text-slate-300">{l.date} • <b>{l.id}</b></div>
                      <div className="text-slate-400 text-xs">{t("active.effective_rate", { apr: (l.interest_apr_bps/100).toFixed(2) })}</div>
                    </div>
                    <div className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300">{l.status}</div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-6 gap-3 text-sm">
                    <div>
                      <div className="text-slate-400 text-xs">{t("active.value")}</div>
                      <div className="text-slate-200">{l.currency === "USD" ? "$" : "R$"} {l.principal.toLocaleString("pt-BR")}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-xs">{t("active.collateral")}</div>
                      <div className="text-slate-200">{l.collateralXLM} XLM</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-xs">{t("active.balance_due")}</div>
                      <div className="text-slate-200">{l.currency === "USD" ? "$" : "R$"} {l.balanceDue.toLocaleString("pt-BR")}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-xs">{t("active.due_in")}</div>
                      <div className="text-slate-200">{t("active.days", { days: l.dueInDays })}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-xs">{t("active.risk")}</div>
                      <div className="text-amber-400">{t("active.monitor_collateral")}</div>
                    </div>
                    <div className="flex items-end">
                      <div className="flex gap-2">
                        <button disabled className="px-3 py-2 rounded bg-slate-800 text-slate-400 text-xs cursor-not-allowed" title={tc("soon")}>{t("active.pay")}</button>
                        <button disabled className="px-3 py-2 rounded bg-slate-800 text-slate-400 text-xs cursor-not-allowed" title={tc("soon")}>{t("active.add_collateral")}</button>
                        <Link href={`/loans/${l.id}`} className="px-3 py-2 rounded bg-slate-800 text-slate-200 text-xs">{t("active.details")}</Link>
                      </div>
                    </div>
                  </div>
                  {/* Summary details */}
                  <div className="mt-2 text-xs text-slate-500">{t("active.summary_mock")}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loan History */}
      <Card>
        <CardHeader>
          <CardTitle>{t("history.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoans.length === 0 ? (
            <div className="text-sm text-slate-400">{t("history.none")}</div>
          ) : (
            <div className="space-y-2">
              {historyLoans.map((h) => (
                <div key={h.id} className="flex items-center justify-between bg-slate-900 rounded px-3 py-2 text-sm">
                  <div className="text-slate-300">{h.start} • {h.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
                  <div className="text-slate-400 text-xs">{t("history.paid_at", { date: h.paidAt, status: h.status })}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loan Simulator (interactive) */}
      <Card>
        <CardHeader>
          <CardTitle>{t("simulator.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-slate-400 mb-2">{t("simulator.subtitle")}</div>
          <LoanSimulator ltvBps={pool.ltv_bps ?? 0} interestAprBps={pool.interest_bps ?? 0} wallet={{ xlm: wallet?.xlm ?? 0, stlt: wallet?.stlt }} />
          <div className="text-xs text-slate-500 mt-3">{t("simulator.balance", { xlm: wallet?.xlm, stlt: Number(wallet?.stlt || 0).toLocaleString("pt-BR") })}</div>
        </CardContent>
      </Card>

      {/* Conditions and Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>{t("conditions.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-slate-400">{t("conditions.fees")}</div>
              <div>{t("conditions.apr_line", { apr: interestPct })}</div>
            </div>
            <div>
              <div className="text-slate-400">{t("conditions.limits")}</div>
              <div>{t("conditions.range")}</div>
            </div>
            <div>
              <div className="text-slate-400">{t("conditions.collateral")}</div>
              <div>{t("conditions.ltv_assets", { ltv: ltvPct })}</div>
            </div>
          </div>
          <ul className="mt-3 list-disc pl-5 text-xs text-slate-400 space-y-1">
            <li>{t("conditions.note_iof")}</li>
            <li>{t("conditions.note_late")}</li>
            <li>{t("conditions.note_liquidation")}</li>
          </ul>
        </CardContent>
      </Card>

      {/* Step-by-step contracting */}
      <Card>
        <CardHeader>
          <CardTitle>{t("steps.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-300">
            <li>{t("steps.s1")}</li>
            <li>{t("steps.s2")}</li>
            <li>{t("steps.s3")}</li>
            <li>{t("steps.s4")}</li>
          </ol>
          <div className="mt-3 flex gap-2">
            <button className="px-4 py-2 rounded bg-emerald-600 text-white text-sm" title="Mock">{t("steps.apply")}</button>
            <button className="px-4 py-2 rounded bg-slate-800 text-slate-200 text-sm" title="Mock">{t("steps.track")}</button>
          </div>
        </CardContent>
      </Card>

      {/* Collateral and Limit Management */}
      <Card>
        <CardHeader>
          <CardTitle>{t("collateral.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-slate-400">{t("collateral.limit_available")}</div>
              <div className="text-slate-200">R$ 12.000</div>
            </div>
            <div>
              <div className="text-slate-400">{t("collateral.deposited")}</div>
              <div className="text-slate-200">450 XLM • 2.000 STLT</div>
            </div>
            <div>
              <div className="text-slate-400">{t("collateral.avg_ltv")}</div>
              <div className="text-amber-300">{t("collateral.risk_attention")}</div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <button className="px-3 py-2 rounded bg-slate-800 text-slate-200">{t("collateral.add")}</button>
            <button className="px-3 py-2 rounded bg-slate-800 text-slate-200">{t("collateral.remove")}</button>
            <button className="px-3 py-2 rounded bg-slate-800 text-slate-200">{t("collateral.renegotiate")}</button>
          </div>
          <div className="mt-2 text-xs text-slate-500">{t("collateral.note_ltv")}</div>
        </CardContent>
      </Card>

      {/* Alerts and Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>{t("alerts.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 text-sm space-y-1 text-amber-300">
            <li>{t("alerts.item1")}</li>
            <li>{t("alerts.item2")}</li>
          </ul>
        </CardContent>
      </Card>

      {/* Help & FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>{t("faq.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-300">{t("faq.text")}</p>
          <div className="mt-3 flex gap-2 text-sm">
            <Link href="/docs" className="px-3 py-2 rounded bg-slate-800">{t("faq.view_faq")}</Link>
            <Link href="/help" className="px-3 py-2 rounded bg-slate-800">{t("faq.need_help")}</Link>
          </div>
          <div className="text-xs text-slate-500 mt-2">{t("faq.security_note")}</div>
        </CardContent>
      </Card>

      {/* Legal and Contractual Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t("legal.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/docs" className="px-3 py-2 rounded bg-slate-800">{t("legal.loan_contract")}</Link>
            <Link href="/docs" className="px-3 py-2 rounded bg-slate-800">{t("legal.loan_terms")}</Link>
            <Link href="/help" className="px-3 py-2 rounded bg-slate-800">{t("legal.loan_faq")}</Link>
          </div>
          <div className="text-xs text-slate-500 mt-2">{t("legal.read_first")}</div>
        </CardContent>
      </Card>

      {/* Educational Content and Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>{t("education.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 text-sm space-y-1 text-slate-300">
            <li>{t("education.item1")}</li>
            <li>{t("education.item2")}</li>
            <li>{t("education.item3")}</li>
          </ul>
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <button className="px-4 py-2 rounded bg-emerald-600 text-white text-sm">{t("quick.apply")}</button>
        <button className="px-4 py-2 rounded bg-slate-800 text-slate-200 text-sm">{t("quick.simulate")}</button>
        <button className="px-4 py-2 rounded bg-slate-800 text-slate-200 text-sm">{t("quick.track")}</button>
        <button className="px-4 py-2 rounded bg-slate-800 text-slate-200 text-sm">{t("quick.prepay")}</button>
        <button className="px-4 py-2 rounded bg-slate-800 text-slate-200 text-sm">{t("quick.support")}</button>
      </div>
      </div>
    </div>
  );
}
