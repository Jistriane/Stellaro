"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";

export default function PixPage() {
  const t = useTranslations("pix");

  // Enable real-time updates when the wallet connects
  useRealTimeUpdates();

  // Tab and form state (mock)
  const [tab, setTab] = useState<"deposit" | "withdraw">("deposit");
  const [amountDep, setAmountDep] = useState<string>("");
  const [amountWdr, setAmountWdr] = useState<string>("");
  const [destKey, setDestKey] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Service status (mock)
  const service = { status: "Available" as "Available" | "Unavailable" | "Maintenance", note: "Operating normally" };

  // Balances/limits/fees (mock)
  const wallet = { balanceBRL: 3211, dailyLimitBRL: 10000, feePct: 0 };

  // Temporary Pix key (mock)
  const pixKey = useMemo(() => "pix+stelato.mock@example.com", []);

  // Transaction history (mock)
  const history = [
    { type: "Deposit", value: 500, date: "2025-08-13 11:20", status: "Completed", key: "email@bank.com" },
    { type: "Withdrawal", value: 300, date: "2025-08-12 16:40", status: "Pending", key: "+55 11 90000-0000" },
  ];

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(pixKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  }

  function onGenerateQR() {
    // Mock only; real integration would generate EMV/BR Code payload
    alert(t("deposit.qr_generated", { key: pixKey }));
  }

  function onRequestWithdraw() {
    if (!amountWdr || Number(amountWdr) <= 0 || !destKey) {
      alert(t("withdraw.need_valid"));
      return;
    }
    alert(t("withdraw.request_sent"));
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("header.title")}</h1>
        <div className="text-xs text-slate-500">{t("header.subtitle")}</div>
      </div>

      {/* Service status */}
      <Card>
        <CardHeader>
          <CardTitle>{t("service.status_title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className={`px-2 py-1 rounded text-xs ${service.status === "Available" ? "bg-emerald-900/40 text-emerald-300" : service.status === "Maintenance" ? "bg-amber-900/40 text-amber-300" : "bg-rose-900/40 text-rose-300"}`}>
              {service.status === "Available" ? t("service.available") : service.status === "Maintenance" ? t("service.maintenance") : t("service.unavailable")}
            </span>
            <span className="text-slate-400">{t("service.note_ok")}</span>
          </div>
        </CardContent>
      </Card>

      {/* Deposit/Withdraw tabs */}
      <Card>
        <CardHeader>
          <CardTitle>{t("ops.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 text-sm mb-4">
            <button onClick={() => setTab("deposit")} className={`px-3 py-2 rounded ${tab === "deposit" ? "bg-primary text-black" : "bg-slate-800 text-slate-300"}`}>{t("ops.deposit")}</button>
            <button onClick={() => setTab("withdraw")} className={`px-3 py-2 rounded ${tab === "withdraw" ? "bg-primary text-black" : "bg-slate-800 text-slate-300"}`}>{t("ops.withdraw")}</button>
          </div>

          {tab === "deposit" ? (
            <div className="space-y-4">
              <div className="text-sm">{t("deposit.how_much")}</div>
              <input
                value={amountDep}
                onChange={(e) => setAmountDep(e.target.value)}
                placeholder={t("deposit.placeholder_amount")}
                className="w-full max-w-xs rounded bg-slate-900 px-3 py-2 text-sm outline-none border border-slate-800"
                inputMode="decimal"
              />

              <div className="text-xs text-slate-500">{t("deposit.auto_credit")}</div>

              <div className="space-y-2">
                <div className="text-sm text-slate-400">{t("deposit.temp_key")}</div>
                <div className="flex items-center gap-2">
                  <div className="rounded bg-slate-900 px-3 py-2 text-sm select-all">{pixKey}</div>
                  <button onClick={onCopy} className="px-3 py-2 rounded bg-slate-800 text-slate-200 text-xs">{copied ? t("deposit.copied") : t("deposit.copy")}</button>
                  <button onClick={onGenerateQR} className="px-3 py-2 rounded bg-slate-800 text-slate-200 text-xs">{t("deposit.qr")}</button>
                </div>
                <div className="mt-1 h-28 w-28 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-slate-500">QR CODE (mock)</div>
              </div>

              <div className="text-xs text-slate-500">
                {t("deposit.instructions_title")}
                <ol className="list-decimal pl-5 space-y-1 mt-1">
                  <li>{t("deposit.i1")}</li>
                  <li>{t("deposit.i2")}</li>
                </ol>
                <div className="mt-1">{t("deposit.avg_time")}</div>
                <div className="mt-1">{t("deposit.limits", { daily: wallet.dailyLimitBRL.toLocaleString("en-US"), fee: wallet.feePct })}</div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm">{t("withdraw.how_much")}</div>
              <input
                value={amountWdr}
                onChange={(e) => setAmountWdr(e.target.value)}
                placeholder={t("withdraw.placeholder_amount")}
                className="w-full max-w-xs rounded bg-slate-900 px-3 py-2 text-sm outline-none border border-slate-800"
                inputMode="decimal"
              />
              <div className="text-sm">{t("withdraw.to_which_key")}</div>
              <input
                value={destKey}
                onChange={(e) => setDestKey(e.target.value)}
                placeholder={t("withdraw.placeholder_key")}
                className="w-full max-w-lg rounded bg-slate-900 px-3 py-2 text-sm outline-none border border-slate-800"
              />
              <div className="text-xs text-slate-500">{t("withdraw.balances", { balance: wallet.balanceBRL.toLocaleString("en-US"), daily: wallet.dailyLimitBRL.toLocaleString("en-US"), fee: wallet.feePct })}</div>
              <div className="flex gap-2">
                <button onClick={onRequestWithdraw} className="px-3 py-2 rounded bg-primary text-black text-sm">{t("withdraw.request")}</button>
                <button onClick={() => confirm("OK?") && onRequestWithdraw()} className="px-3 py-2 rounded bg-slate-800 text-slate-200 text-sm">{t("withdraw.confirm")}</button>
              </div>
              <div className="text-xs text-slate-500">{t("withdraw.status_pending")}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pix transaction history */}
      <Card>
        <CardHeader>
          <CardTitle>{t("history.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-sm text-slate-400">{t("history.empty")}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {history.map((tItem, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-900 rounded px-3 py-2">
                  <div className="text-slate-300">{tItem.type === "Deposit" ? t("history.type_deposit") : t("history.type_withdraw")} • R$ {tItem.value.toLocaleString("en-US")}</div>
                  <div className="text-xs text-slate-500">{tItem.date} • {tItem.status === "Completed" ? t("history.status_done") : t("history.status_pending")} • {tItem.key}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alerts and important messages */}
      <Card>
        <CardHeader>
          <CardTitle>{t("alerts.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 text-sm space-y-1 text-amber-300">
            <li>{t("alerts.a1")}</li>
            <li>{t("alerts.a2")}</li>
            <li>{t("alerts.a3")}</li>
          </ul>
        </CardContent>
      </Card>

      {/* Help and support */}
      <Card>
        <CardHeader>
          <CardTitle>{t("help.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 text-sm">
            <a href="/docs" className="px-3 py-2 rounded bg-slate-800">{t("help.faq_pix")}</a>
            <a href="/help" className="px-3 py-2 rounded bg-slate-800">{t("help.support")}</a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
