"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";
import { createX402Quote, getX402Status, type X402Quote, type X402Status } from "@/lib/x402";

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
  const [x402Status, setX402Status] = useState<X402Status>({
    enabled: false,
    mode: "disabled",
    network: "stellar:testnet",
    acceptedAsset: "STLT",
    resource: "/payments/x402/settle",
    facilitatorUrl: null,
    providerContractId: null,
    recipient: null,
    apiKeyConfigured: false,
  });
  const [x402Quote, setX402Quote] = useState<X402Quote | null>(null);
  const [x402Loading, setX402Loading] = useState(false);
  const [x402Error, setX402Error] = useState<string | null>(null);

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

  useEffect(() => {
    let active = true;

    getX402Status().then((status) => {
      if (active) {
        setX402Status(status);
      }
    });

    return () => {
      active = false;
    };
  }, []);

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

  async function onGenerateX402Quote() {
    setX402Loading(true);
    setX402Error(null);

    const amount = tab === "deposit" ? amountDep || "25.00" : amountWdr || "25.00";
    const result = await createX402Quote({
      amount,
      asset: x402Status.acceptedAsset,
      intent: tab === "deposit" ? "deposit" : "withdrawal",
      memo: `stellaro:${tab}`,
    });

    if (!result.ok || !result.quote) {
      setX402Quote(null);
      setX402Error(result.error || t("x402.quote_error"));
      setX402Loading(false);
      return;
    }

    setX402Quote(result.quote);
    setX402Loading(false);
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 px-4 py-6 sm:px-6 lg:px-8">
      <Image
        src="/capa.png"
        alt="Stellaro background"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center opacity-30"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/90 to-slate-900/75" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(96,165,250,0.15),transparent_28%),radial-gradient(circle_at_82%_82%,rgba(16,185,129,0.10),transparent_24%)]" />

      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-8">
        <header className="grid gap-6 rounded-[2rem] border border-slate-800/70 bg-slate-950/55 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur-md lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 rounded-full border border-slate-700/80 bg-slate-950/60 px-4 py-2 backdrop-blur-sm">
              <Image src="/logo.png" alt="Stellaro logo" width={48} height={48} className="h-10 w-10 rounded-md object-contain" />
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">PIX</p>
                <p className="text-sm text-slate-200">Deposits and withdrawals with a branded fintech shell</p>
              </div>
            </div>

            <div className="max-w-3xl space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight text-slate-50 sm:text-5xl">{t("header.title")}</h1>
              <p className="max-w-2xl text-base leading-7 text-slate-200/85 sm:text-lg">{t("header.subtitle")}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800/70 bg-slate-950/45 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Deposit</p>
                <p className="mt-3 text-sm leading-6 text-slate-200">Copy your temporary key or generate a QR payload.</p>
              </div>
              <div className="rounded-2xl border border-slate-800/70 bg-slate-950/45 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Withdraw</p>
                <p className="mt-3 text-sm leading-6 text-slate-200">Request transfers to PIX keys with transparent limits.</p>
              </div>
              <div className="rounded-2xl border border-slate-800/70 bg-slate-950/45 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Status</p>
                <p className="mt-3 text-sm leading-6 text-slate-200">Operational status and recent history at a glance.</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/60 p-6 backdrop-blur-md">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Service</p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <span className={`rounded-full px-3 py-1 text-xs ${service.status === "Available" ? "bg-emerald-900/40 text-emerald-300" : service.status === "Maintenance" ? "bg-amber-900/40 text-amber-300" : "bg-rose-900/40 text-rose-300"}`}>
                {service.status === "Available" ? t("service.available") : service.status === "Maintenance" ? t("service.maintenance") : t("service.unavailable")}
              </span>
              <span className="text-slate-400">{t("service.note_ok")}</span>
            </div>
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-200">
              <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Wallet</div>
              <div className="mt-2">R$ {wallet.balanceBRL.toLocaleString("en-US")} available</div>
              <div className="mt-1 text-xs text-slate-500">Daily limit: R$ {wallet.dailyLimitBRL.toLocaleString("en-US")}</div>
            </div>
          </div>
        </header>

        {/* Deposit/Withdraw tabs */}
        <Card className="border-slate-800/70 bg-slate-950/60 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          <CardHeader>
            <CardTitle>{t("ops.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 text-sm mb-4 flex-wrap">
              <button onClick={() => setTab("deposit")} className={`px-3 py-2 rounded-full border ${tab === "deposit" ? "border-sky-500/30 bg-sky-500/10 text-sky-100" : "border-slate-700 bg-slate-900/80 text-slate-300"}`}>{t("ops.deposit")}</button>
              <button onClick={() => setTab("withdraw")} className={`px-3 py-2 rounded-full border ${tab === "withdraw" ? "border-sky-500/30 bg-sky-500/10 text-sky-100" : "border-slate-700 bg-slate-900/80 text-slate-300"}`}>{t("ops.withdraw")}</button>
            </div>

            {tab === "deposit" ? (
              <div className="space-y-4">
                <div className="text-sm">{t("deposit.how_much")}</div>
                <input
                  value={amountDep}
                  onChange={(e) => setAmountDep(e.target.value)}
                  placeholder={t("deposit.placeholder_amount")}
                  className="w-full max-w-xs rounded-xl bg-slate-900/90 px-3 py-2 text-sm outline-none border border-slate-800 text-slate-100 placeholder:text-slate-600"
                  inputMode="decimal"
                />

                <div className="text-xs text-slate-500">{t("deposit.auto_credit")}</div>

                <div className="space-y-2">
                  <div className="text-sm text-slate-400">{t("deposit.temp_key")}</div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="rounded-xl bg-slate-900/90 px-3 py-2 text-sm select-all border border-slate-800">{pixKey}</div>
                    <button onClick={onCopy} className="px-3 py-2 rounded-full border border-slate-700 bg-slate-900/80 text-slate-200 text-xs">{copied ? t("deposit.copied") : t("deposit.copy")}</button>
                    <button onClick={onGenerateQR} className="px-3 py-2 rounded-full border border-slate-700 bg-slate-900/80 text-slate-200 text-xs">{t("deposit.qr")}</button>
                  </div>
                  <div className="mt-1 h-28 w-28 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] text-slate-500">QR CODE (mock)</div>
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
                  className="w-full max-w-xs rounded-xl bg-slate-900/90 px-3 py-2 text-sm outline-none border border-slate-800 text-slate-100 placeholder:text-slate-600"
                  inputMode="decimal"
                />
                <div className="text-sm">{t("withdraw.to_which_key")}</div>
                <input
                  value={destKey}
                  onChange={(e) => setDestKey(e.target.value)}
                  placeholder={t("withdraw.placeholder_key")}
                  className="w-full max-w-lg rounded-xl bg-slate-900/90 px-3 py-2 text-sm outline-none border border-slate-800 text-slate-100 placeholder:text-slate-600"
                />
                <div className="text-xs text-slate-500">{t("withdraw.balances", { balance: wallet.balanceBRL.toLocaleString("en-US"), daily: wallet.dailyLimitBRL.toLocaleString("en-US"), fee: wallet.feePct })}</div>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={onRequestWithdraw} className="px-3 py-2 rounded-full bg-primary text-black text-sm">{t("withdraw.request")}</button>
                  <button onClick={() => confirm("OK?") && onRequestWithdraw()} className="px-3 py-2 rounded-full border border-slate-700 bg-slate-900/80 text-slate-200 text-sm">{t("withdraw.confirm")}</button>
                </div>
                <div className="text-xs text-slate-500">{t("withdraw.status_pending")}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-800/70 bg-slate-950/60 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          <CardHeader>
            <CardTitle>{t("x402.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <p className="text-sm text-slate-300">{t("x402.subtitle")}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className={`rounded-full px-3 py-1 ${x402Status.mode === "live" ? "bg-emerald-900/40 text-emerald-300" : x402Status.mode === "stub" ? "bg-amber-900/40 text-amber-300" : "bg-rose-900/40 text-rose-300"}`}>
                    {t(`x402.mode_${x402Status.mode}`)}
                  </span>
                  <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-slate-300">{t("x402.network")}: {x402Status.network}</span>
                  <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-slate-300">{t("x402.asset")}: {x402Status.acceptedAsset}</span>
                </div>
                <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 text-sm text-slate-300 space-y-2">
                  <div>{t("x402.resource")}: <span className="text-slate-100">{x402Status.resource}</span></div>
                  <div>{t("x402.provider")}: <span className="text-slate-100">{x402Status.providerContractId || "stub-provider-contract"}</span></div>
                  <div>{t("x402.facilitator")}: <span className="text-slate-100 break-all">{x402Status.facilitatorUrl || "https://facilitator.stellaro.local"}</span></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={onGenerateX402Quote}
                    disabled={!x402Status.enabled || x402Loading}
                    className={`px-3 py-2 rounded-full text-sm ${!x402Status.enabled || x402Loading ? "bg-slate-800 text-slate-500 cursor-not-allowed" : "bg-primary text-black"}`}
                  >
                    {x402Loading ? t("x402.loading") : t("x402.generate")}
                  </button>
                  <Link href="/docs" className="px-3 py-2 rounded-full border border-slate-700 bg-slate-900/80 text-slate-200 text-sm">
                    {t("x402.docs")}
                  </Link>
                </div>
                {x402Error ? <p className="text-sm text-rose-300">{x402Error}</p> : null}
              </div>

              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 text-sm text-slate-300">
                {x402Quote ? (
                  <div className="space-y-2">
                    <div><span className="text-slate-500">{t("x402.quote_id")}:</span> <span className="text-slate-100 break-all">{x402Quote.sessionId}</span></div>
                    <div><span className="text-slate-500">{t("x402.quote_total")}:</span> <span className="text-slate-100">{x402Quote.settlement.total} {x402Quote.settlement.asset}</span></div>
                    <div><span className="text-slate-500">{t("x402.quote_expires")}:</span> <span className="text-slate-100">{new Date(x402Quote.settlement.expiresAt).toLocaleString("en-US")}</span></div>
                    <div><span className="text-slate-500">{t("x402.quote_url")}:</span> <span className="text-slate-100 break-all">{x402Quote.headers["x402-payment-url"]}</span></div>
                    <div><span className="text-slate-500">{t("x402.quote_wallet")}:</span> <span className="text-slate-100">{x402Quote.settlement.walletAddress || "not provided"}</span></div>
                    <div><span className="text-slate-500">{t("x402.quote_memo")}:</span> <span className="text-slate-100 break-all">{x402Quote.settlement.memo}</span></div>
                    <p className="pt-2 text-xs text-slate-400">{x402Quote.guidance}</p>
                  </div>
                ) : (
                  <div className="text-sm text-slate-400">{t("x402.empty")}</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pix transaction history */}
        <Card className="border-slate-800/70 bg-slate-950/60 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          <CardHeader>
            <CardTitle>{t("history.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="text-sm text-slate-400">{t("history.empty")}</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {history.map((tItem, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-900/70 px-3 py-2">
                    <div className="text-slate-300">{tItem.type === "Deposit" ? t("history.type_deposit") : t("history.type_withdraw")} • R$ {tItem.value.toLocaleString("en-US")}</div>
                    <div className="text-xs text-slate-500">{tItem.date} • {tItem.status === "Completed" ? t("history.status_done") : t("history.status_pending")} • {tItem.key}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alerts and important messages */}
        <Card className="border-slate-800/70 bg-slate-950/60 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
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
        <Card className="border-slate-800/70 bg-slate-950/60 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          <CardHeader>
            <CardTitle>{t("help.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 text-sm">
              <Link href="/docs" className="px-3 py-2 rounded-full border border-slate-700 bg-slate-900/80">{t("help.faq_pix")}</Link>
              <Link href="/help" className="px-3 py-2 rounded-full border border-slate-700 bg-slate-900/80">{t("help.support")}</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
