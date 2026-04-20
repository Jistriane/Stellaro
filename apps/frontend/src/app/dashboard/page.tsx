"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  getContractIds,
  viewLoansPool,
  viewPortfolio,
  viewGovernance,
  getWalletBalances,
} from "@/lib/soroban";
import { useTranslations } from "next-intl";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const t = useTranslations("dashboard");

  // Enable real-time updates when the wallet connects
  useRealTimeUpdates();
  
  const [data, setData] = useState<{
    loans: any;
    portfolio: any;
    gov: any;
    balances: any;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadData() {
      const ids = getContractIds();
      const [loans, portfolio, gov, balances] = await Promise.all([
        viewLoansPool(),
        viewPortfolio(),
        viewGovernance(),
        getWalletBalances(),
      ]);
      
      setData({ loans, portfolio, gov, balances });
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
          <div className="text-slate-400">Erro ao carregar dados</div>
        </div>
      </div>
    );
  }

  const { loans, portfolio, gov, balances } = data;
  const ids = getContractIds();

  // Local mocks for UI (i18n)
  const recentActivities = [
    {
      date: "2025-08-20",
      desc: t("recent.items.received_stlt_brl", { amount: 200, asset: "STLT-BRL" }),
      amount: "+200",
      status: t("status.completed"),
    },
    {
      date: "2025-08-18",
      desc: t("recent.items.requested_loan"),
      amount: "-12.000",
      status: t("status.pending"),
    },
    {
      date: "2025-08-15",
      desc: t("recent.items.voted_proposal", { id: 22 }),
      amount: "—",
      status: t("status.completed"),
    },
  ];
  const loansActive = [
    { id: "LN-001", principal: 12000, asset: "STLT-BRL", due: "2025-09-20", status: t("loans.on_time"), collateral: "USDC/T-BILL" },
  ];
  const notifications = [
    { kind: "governance", text: t("notifications.items.open_proposal") },
    { kind: "kyc", text: t("notifications.items.kyc_selfie_pending") },
    { kind: "risk", text: t("notifications.items.review_collateral") },
  ];

  // Estimated conversions (mock)
  const stlt = Number.parseFloat(balances.stlt || "0");
  const xlm = Number.parseFloat(balances.xlm || "0");
  const rateBRL = 1.0; // 1 STLT ~= 1 BRL (mock)
  const rateUSD = 0.2; // mock
  const stltBRL = stlt * rateBRL;
  const stltUSD = stlt * rateUSD;

  function truncatePubKey(pk?: string) {
    if (!pk) return "—";
    return pk.length > 12 ? `${pk.slice(0, 6)}...${pk.slice(-6)}` : pk;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Branding + Greeting */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-primary font-bold">S</div>
          <div>
            <h1 className="text-2xl font-semibold">{t("greeting.welcome_back")}</h1>
            <div className="text-xs text-slate-400">{t("greeting.stellar_key")} {truncatePubKey(ids.STELLAR_PUBLIC_KEY)}</div>
          </div>
        </div>
        <div className="text-xs text-slate-500">{t("greeting.updated_now")}</div>
      </div>

      {/* Balances */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>STLT-BRL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">R$ {stltBRL.toLocaleString("en-US", { maximumFractionDigits: 2 })}</div>
            <div className="text-xs text-slate-500">{t("balances.estimated_stlt_balance", { amount: stlt.toLocaleString("en-US", { maximumFractionDigits: 4 }) })}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>STLT-USD</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">$ {stltUSD.toLocaleString("en-US", { maximumFractionDigits: 2 })}</div>
            <div className="text-xs text-slate-500">{t("balances.estimated_mock")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>XLM</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{xlm.toLocaleString("en-US", { maximumFractionDigits: 4 })}</div>
            <div className="text-xs text-slate-500">{t("balances.available")}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick access */}
      <Card>
        <CardHeader>
          <CardTitle>{t("quick_access.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Link className="px-3 py-2 rounded bg-primary text-slate-900 text-sm" href="/pix">{t("quick_access.deposit_pix")}</Link>
            <Link className="px-3 py-2 rounded bg-slate-800 text-sm" href="/stablecoin">{t("quick_access.swap_stablecoins")}</Link>
            <Link className="px-3 py-2 rounded bg-slate-800 text-sm" href="/loans">{t("quick_access.request_loan")}</Link>
            <Link className="px-3 py-2 rounded bg-slate-800 text-sm" href="/governance">{t("quick_access.governance")}</Link>
            <Link className="px-3 py-2 rounded bg-slate-800 text-sm" href="/profile">{t("quick_access.profile_kyc")}</Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent activities + Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("recent.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recentActivities.map((a) => (
                <li key={a.date + a.desc} className="flex items-center justify-between bg-slate-900 rounded px-3 py-2 text-sm">
                  <div>
                    <div className="text-slate-200">{a.desc}</div>
                    <div className="text-xs text-slate-500">{a.date} • {a.status}</div>
                  </div>
                  <div className="text-slate-300">{a.amount}</div>
                </li>
              ))}
            </ul>
            <div className="mt-3">
              <Link className="text-sm underline text-slate-200" href="/wallet">{t("recent.view_all")}</Link>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("notifications.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {notifications.map((n, i) => (
                <li key={i} className="flex items-center justify-between bg-slate-900 rounded px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
                    <span>{n.text}</span>
                  </div>
                  <Link className="text-xs underline text-slate-300" href={n.kind === "kyc" ? "/profile" : n.kind === "governance" ? "/governance" : "/risk"}>{t("notifications.view")}</Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Loans */}
      <Card>
        <CardHeader>
          <CardTitle>{t("loans.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-slate-500 mb-2">{t("loans.pool_ltv_interest", { ltv: loans.ltv_bps ?? 0, interest: loans.interest_bps ?? 0 })}</div>
          <ul className="space-y-2">
            {loansActive.map((l) => (
              <li key={l.id} className="bg-slate-900 rounded p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium">{l.principal.toLocaleString("pt-BR")} {l.asset}</div>
                  <div className="text-xs text-slate-500">{t("loans.status")}: <b className="text-slate-300">{l.status}</b></div>
                </div>
                <div className="text-xs text-slate-500">{t("loans.collateral_due", { collateral: l.collateral, due: l.due })}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Link className="px-3 py-1 rounded bg-slate-800 text-xs" href={`/loans/${l.id}`}>{t("loans.view_details")}</Link>
                  <Link className="px-3 py-1 rounded bg-slate-800 text-xs" href={`/loans/${l.id}?action=renegotiate`}>{t("loans.renegotiate")}</Link>
                  <Link className="px-3 py-1 rounded bg-slate-800 text-xs" href={`/loans/${l.id}?action=prepay`}>{t("loans.prepay")}</Link>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Portfolio */}
      <Card>
        <CardHeader>
          <CardTitle>{t("portfolio.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-slate-500 mb-2">{t("portfolio.contract")}: <span className="text-slate-300">{ids.PORTFOLIO_CONTRACT_ID || "—"}</span></div>
          <ul className="space-y-2">
            {portfolio.allocation.map((a) => (
              <li key={a.asset} className="text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-300">{a.asset}</span>
                  <span className="text-slate-400">{(a.pct_bps/100).toFixed(2)}%</span>
                </div>
                <Progress value={a.pct_bps / 100} className="mt-1" />
              </li>
            ))}
          </ul>
          <div className="text-xs text-slate-500 mt-2">{t("portfolio.history_mock")}</div>
        </CardContent>
      </Card>

      {/* Governance */}
      <Card>
        <CardHeader>
          <CardTitle>{t("governance.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm mb-2">{t("governance.open_proposals", { count: gov.proposals_open ?? 0 })}</div>
          <div className="text-xs text-slate-500">Admin: <span className="text-slate-300">{gov.admin}</span></div>
          <div className="mt-3">
            <Link className="px-3 py-2 rounded bg-slate-800 text-sm" href="/governance">{t("governance.view_proposals")}</Link>
          </div>
        </CardContent>
      </Card>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>{t("profile.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">👤</div>
            <div>
              <div className="text-sm">{t("profile.user")}</div>
              <div className="text-xs text-slate-500">KYC: <b className="text-amber-400">{t("profile.kyc_pending")}</b></div>
            </div>
          </div>
          <div className="mt-3">
            <Link className="px-3 py-2 rounded bg-primary text-slate-900 text-sm" href="/profile">{t("profile.complete_kyc")}</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
