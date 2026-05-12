"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";
import { createX402Quote, getX402Status, type X402Quote, type X402Status } from "@/lib/x402";
import { getHorizonBaseUrl, getWalletBalances } from "@/lib/soroban";
import { useWalletStore } from "@/state/wallet";
import {
  createEtherfuseOrder,
  createEtherfuseQuote,
  type EtherfuseOrder,
  getEtherfuseStatus,
  type EtherfuseQuote,
  type EtherfuseStatus,
} from "@/lib/etherfuse";

type PixHistoryItem = {
  type: "Deposit" | "Withdrawal";
  value: string;
  asset: string;
  date: string;
  status: "Completed";
  key: string;
};

export default function PixPage() {
  const t = useTranslations("pix");
  const walletConnected = useWalletStore((s) => s.connected);
  const walletAddress = useWalletStore((s) => s.address);
  const walletNetwork = useWalletStore((s) => s.network);
  const refreshBalance = useWalletStore((s) => s.refreshBalance);

  // Enable real-time updates when the wallet connects
  useRealTimeUpdates();

  // Tab and form state
  const [tab, setTab] = useState<"deposit" | "withdraw">("deposit");
  const [amountDep, setAmountDep] = useState<string>("");
  const [amountWdr, setAmountWdr] = useState<string>("");
  const [destKey, setDestKey] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [qrPayload, setQrPayload] = useState<string>("");
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [walletData, setWalletData] = useState<{ xlm: string; stlt: string }>({ xlm: "0", stlt: "0" });
  const [history, setHistory] = useState<PixHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
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
  const [etherfuseStatus, setEtherfuseStatus] = useState<EtherfuseStatus>({
    enabled: false,
    mode: "disabled",
    apiBaseUrl: "https://api.sand.etherfuse.com",
    blockchain: "stellar",
    defaultQuoteType: "onramp",
    defaultSourceAsset: "MXN",
    defaultTargetAsset: "USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    customerIdConfigured: false,
    walletAddressConfigured: false,
    apiKeyConfigured: false,
  });
  const [etherfuseQuote, setEtherfuseQuote] = useState<EtherfuseQuote | null>(null);
  const [etherfuseOrder, setEtherfuseOrder] = useState<EtherfuseOrder | null>(null);
  const [etherfuseLoading, setEtherfuseLoading] = useState(false);
  const [etherfuseOrderLoading, setEtherfuseOrderLoading] = useState(false);
  const [etherfuseError, setEtherfuseError] = useState<string | null>(null);

  const service = useMemo(() => {
    if (!walletConnected || !walletAddress) {
      return { status: "Unavailable" as const, note: "Connect your wallet to enable Pix." };
    }
    if (walletNetwork !== "testnet") {
      return { status: "Maintenance" as const, note: "Switch to testnet wallet network." };
    }
    return { status: "Available" as const, note: "Connected to Stellar testnet." };
  }, [walletConnected, walletAddress, walletNetwork]);

  const dailyLimitBRL = Number(process.env.NEXT_PUBLIC_PIX_DAILY_LIMIT_BRL ?? "0");
  const feePct = Number(process.env.NEXT_PUBLIC_PIX_FEE_PCT ?? "0");
  const balanceBRL = Number.parseFloat(walletData.stlt || "0");
  const wallet = {
    balanceBRL: Number.isFinite(balanceBRL) ? balanceBRL : 0,
    dailyLimitBRL,
    feePct,
  };

  const pixKey = useMemo(() => {
    if (!walletAddress) return "";
    return `stellar:${walletAddress}`;
  }, [walletAddress]);

  useEffect(() => {
    let active = true;

    Promise.all([getX402Status(), getEtherfuseStatus()]).then(([x402, etherfuse]) => {
      if (!active) {
        return;
      }
      setX402Status(x402);
      setEtherfuseStatus(etherfuse);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadWalletData() {
      if (!walletConnected || !walletAddress) {
        setWalletData({ xlm: "0", stlt: "0" });
        setHistory([]);
        setWalletError(null);
        return;
      }

      setWalletLoading(true);
      setHistoryLoading(true);
      setWalletError(null);

      try {
        await refreshBalance();

        const [balancesRes, paymentsRes] = await Promise.all([
          getWalletBalances(walletAddress),
          fetch(`${getHorizonBaseUrl()}/accounts/${encodeURIComponent(walletAddress)}/payments?limit=20&order=desc`, { cache: "no-store" }),
        ]);

        if (!active) return;

        setWalletData({ xlm: balancesRes.xlm, stlt: balancesRes.stlt });

        if (!paymentsRes.ok) {
          throw new Error(`Horizon payments ${paymentsRes.status}`);
        }

        const body = (await paymentsRes.json()) as {
          _embedded?: {
            records?: Array<{
              type: string;
              from?: string;
              to?: string;
              amount?: string;
              asset_type?: string;
              asset_code?: string;
              created_at?: string;
            }>;
          };
        };

        const records = (body._embedded?.records || []).filter((r) =>
          r.type === "payment" || r.type === "path_payment_strict_receive" || r.type === "path_payment_strict_send"
        );

        const parsed = records.map((r): PixHistoryItem => {
          const isDeposit = (r.to || "") === walletAddress;
          const asset = r.asset_type === "native" ? "XLM" : r.asset_code || "ASSET";
          return {
            type: isDeposit ? "Deposit" : "Withdrawal",
            value: r.amount || "0",
            asset,
            date: r.created_at ? new Date(r.created_at).toLocaleString("en-US") : "-",
            status: "Completed",
            key: isDeposit ? (r.from || "-") : (r.to || "-"),
          };
        });

        setHistory(parsed);
      } catch {
        if (!active) return;
        setWalletError("Failed to load wallet data from testnet.");
        setHistory([]);
      } finally {
        if (!active) return;
        setWalletLoading(false);
        setHistoryLoading(false);
      }
    }

    void loadWalletData();

    return () => {
      active = false;
    };
  }, [walletConnected, walletAddress, walletNetwork, refreshBalance]);

  async function onCopy() {
    if (!pixKey) return;
    try {
      await navigator.clipboard.writeText(pixKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  }

  function onGenerateQR() {
    if (!walletConnected || !walletAddress || !pixKey) {
      alert("Connect a testnet wallet before generating Pix data.");
      return;
    }
    const amount = tab === "deposit" ? (amountDep || "0") : (amountWdr || "0");
    const payload = JSON.stringify(
      {
        network: "stellar:testnet",
        walletAddress,
        pixKey,
        amount,
        createdAt: new Date().toISOString(),
      },
      null,
      2
    );
    setQrPayload(payload);
  }

  function onRequestWithdraw() {
    if (!walletConnected || !walletAddress) {
      alert("Connect a testnet wallet before requesting withdrawal.");
      return;
    }
    if (!amountWdr || Number(amountWdr) <= 0 || !destKey) {
      alert(t("withdraw.need_valid"));
      return;
    }
    if (Number(amountWdr) > wallet.balanceBRL) {
      alert("Insufficient STLT balance for this withdrawal amount.");
      return;
    }
    alert("Withdrawal request created.");
  }

  async function onGenerateX402Quote() {
    setX402Loading(true);
    setX402Error(null);

    const amount = tab === "deposit" ? amountDep || "25.00" : amountWdr || "25.00";
    const result = await createX402Quote({
      amount,
      asset: x402Status.acceptedAsset,
      walletAddress: walletAddress || undefined,
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

  async function onGenerateEtherfuseQuote() {
    setEtherfuseLoading(true);
    setEtherfuseError(null);

    const amount = tab === "deposit" ? amountDep || "250" : amountWdr || "250";
    const result = await createEtherfuseQuote({
      amount,
      quoteType: tab === "deposit" ? "onramp" : "offramp",
      sourceAsset: etherfuseStatus.defaultSourceAsset,
      targetAsset: etherfuseStatus.defaultTargetAsset,
    });

    if (!result.ok || !result.quote) {
      setEtherfuseQuote(null);
      setEtherfuseError(result.error || t("etherfuse.quote_error"));
      setEtherfuseLoading(false);
      return;
    }

    setEtherfuseQuote(result.quote);
    setEtherfuseOrder(null);
    setEtherfuseLoading(false);
  }

  async function onCreateEtherfuseOrder() {
    if (!etherfuseQuote) {
      setEtherfuseError(t("etherfuse.order_need_quote"));
      return;
    }

    setEtherfuseOrderLoading(true);
    setEtherfuseError(null);

    const result = await createEtherfuseOrder({
      quoteId: etherfuseQuote.id,
      walletAddress: walletAddress || x402Quote?.settlement.walletAddress || undefined,
      memo: `stellaro:${tab}:order`,
    });

    if (!result.ok || !result.order) {
      setEtherfuseOrder(null);
      setEtherfuseError(result.error || t("etherfuse.order_error"));
      setEtherfuseOrderLoading(false);
      return;
    }

    setEtherfuseOrder(result.order);
    setEtherfuseOrderLoading(false);
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
              <span className="text-slate-400">{service.note}</span>
            </div>
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-200">
              <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Wallet</div>
              <div className="mt-2">R$ {wallet.balanceBRL.toLocaleString("en-US", { maximumFractionDigits: 2 })} available</div>
              <div className="mt-1 text-xs text-slate-500">XLM: {walletData.xlm} • STLT: {walletData.stlt}</div>
              <div className="mt-1 text-xs text-slate-500">Daily limit: R$ {wallet.dailyLimitBRL.toLocaleString("en-US")}</div>
              {walletAddress ? <div className="mt-1 text-[11px] break-all text-slate-500">{walletAddress}</div> : null}
              {walletLoading ? <div className="mt-1 text-xs text-slate-500">Loading wallet data...</div> : null}
              {walletError ? <div className="mt-1 text-xs text-rose-300">{walletError}</div> : null}
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
                    <div className="rounded-xl bg-slate-900/90 px-3 py-2 text-sm select-all border border-slate-800">{pixKey || "Connect wallet to generate key"}</div>
                    <button onClick={onCopy} disabled={!pixKey} className="px-3 py-2 rounded-full border border-slate-700 bg-slate-900/80 text-slate-200 text-xs disabled:opacity-50 disabled:cursor-not-allowed">{copied ? t("deposit.copied") : t("deposit.copy")}</button>
                    <button onClick={onGenerateQR} disabled={!pixKey} className="px-3 py-2 rounded-full border border-slate-700 bg-slate-900/80 text-slate-200 text-xs disabled:opacity-50 disabled:cursor-not-allowed">Generate payload</button>
                  </div>
                  <div className="mt-1 rounded-2xl bg-slate-800 border border-slate-700 p-3 text-[11px] text-slate-300 whitespace-pre-wrap break-all min-h-28">{qrPayload || "Generate a payload to render with your QR provider."}</div>
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
                <div className="text-xs text-slate-500">{t("withdraw.balances", { balance: wallet.balanceBRL.toLocaleString("en-US", { maximumFractionDigits: 2 }), daily: wallet.dailyLimitBRL.toLocaleString("en-US"), fee: wallet.feePct })}</div>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={onRequestWithdraw} className="px-3 py-2 rounded-full bg-primary text-black text-sm">{t("withdraw.request")}</button>
                  <button onClick={() => confirm("OK?") && onRequestWithdraw()} className="px-3 py-2 rounded-full border border-slate-700 bg-slate-900/80 text-slate-200 text-sm">{t("withdraw.confirm")}</button>
                </div>
                <div className="text-xs text-slate-500">Requests are prepared from your connected wallet context.</div>
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

        <Card className="border-slate-800/70 bg-slate-950/60 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          <CardHeader>
            <CardTitle>{t("etherfuse.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <p className="text-sm text-slate-300">{t("etherfuse.subtitle")}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className={`rounded-full px-3 py-1 ${etherfuseStatus.mode === "live" ? "bg-emerald-900/40 text-emerald-300" : etherfuseStatus.mode === "stub" ? "bg-amber-900/40 text-amber-300" : "bg-rose-900/40 text-rose-300"}`}>
                    {t(`etherfuse.mode_${etherfuseStatus.mode}`)}
                  </span>
                  <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-slate-300">{t("etherfuse.network")}: {etherfuseStatus.blockchain}</span>
                  <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-slate-300">{t("etherfuse.quote_type")}: {etherfuseStatus.defaultQuoteType}</span>
                </div>

                <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 text-sm text-slate-300 space-y-2">
                  <div>{t("etherfuse.api")}: <span className="text-slate-100 break-all">{etherfuseStatus.apiBaseUrl}</span></div>
                  <div>{t("etherfuse.source_asset")}: <span className="text-slate-100 break-all">{etherfuseStatus.defaultSourceAsset}</span></div>
                  <div>{t("etherfuse.target_asset")}: <span className="text-slate-100 break-all">{etherfuseStatus.defaultTargetAsset}</span></div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={onGenerateEtherfuseQuote}
                    disabled={!etherfuseStatus.enabled || etherfuseLoading}
                    className={`px-3 py-2 rounded-full text-sm ${!etherfuseStatus.enabled || etherfuseLoading ? "bg-slate-800 text-slate-500 cursor-not-allowed" : "bg-primary text-black"}`}
                  >
                    {etherfuseLoading ? t("etherfuse.loading") : t("etherfuse.generate")}
                  </button>
                  <Link href="/docs" className="px-3 py-2 rounded-full border border-slate-700 bg-slate-900/80 text-slate-200 text-sm">
                    {t("etherfuse.docs")}
                  </Link>
                  <button
                    onClick={onCreateEtherfuseOrder}
                    disabled={!etherfuseQuote || etherfuseOrderLoading}
                    className={`px-3 py-2 rounded-full text-sm ${!etherfuseQuote || etherfuseOrderLoading ? "bg-slate-800 text-slate-500 cursor-not-allowed" : "border border-slate-700 bg-slate-900/80 text-slate-200"}`}
                  >
                    {etherfuseOrderLoading ? t("etherfuse.order_loading") : t("etherfuse.order_create")}
                  </button>
                </div>

                {etherfuseError ? <p className="text-sm text-rose-300">{etherfuseError}</p> : null}
              </div>

              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 text-sm text-slate-300">
                {etherfuseQuote ? (
                  <div className="space-y-2">
                    <div><span className="text-slate-500">{t("etherfuse.quote_id")}:</span> <span className="text-slate-100 break-all">{etherfuseQuote.id}</span></div>
                    <div><span className="text-slate-500">{t("etherfuse.quote_source")}:</span> <span className="text-slate-100">{etherfuseQuote.sourceAmount} {etherfuseQuote.sourceAsset}</span></div>
                    <div><span className="text-slate-500">{t("etherfuse.quote_destination")}:</span> <span className="text-slate-100">{etherfuseQuote.destinationAmount} {etherfuseQuote.targetAsset}</span></div>
                    <div><span className="text-slate-500">{t("etherfuse.quote_rate")}:</span> <span className="text-slate-100">{etherfuseQuote.exchangeRate}</span></div>
                    <div><span className="text-slate-500">{t("etherfuse.quote_expires")}:</span> <span className="text-slate-100">{new Date(etherfuseQuote.expiresAt).toLocaleString("en-US")}</span></div>
                    <p className="pt-2 text-xs text-slate-400">{etherfuseQuote.guidance}</p>
                    {etherfuseOrder ? (
                      <div className="mt-3 rounded-xl border border-emerald-800/60 bg-emerald-900/20 p-3 text-xs text-emerald-200 space-y-1">
                        <div>{t("etherfuse.order_id")}: <span className="break-all">{etherfuseOrder.id}</span></div>
                        <div>{t("etherfuse.order_status")}: {etherfuseOrder.status}</div>
                        <div>{t("etherfuse.order_direction")}: {etherfuseOrder.direction}</div>
                        <p className="text-emerald-300/80">{etherfuseOrder.guidance}</p>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="text-sm text-slate-400">{t("etherfuse.empty")}</div>
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
            {historyLoading ? (
              <div className="text-sm text-slate-400">Loading testnet history...</div>
            ) : history.length === 0 ? (
              <div className="text-sm text-slate-400">{t("history.empty")}</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {history.map((tItem, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-900/70 px-3 py-2">
                    <div className="text-slate-300">{tItem.type === "Deposit" ? t("history.type_deposit") : t("history.type_withdraw")} • {tItem.value} {tItem.asset}</div>
                    <div className="text-xs text-slate-500">{tItem.date} • {t("history.status_done")} • {tItem.key}</div>
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
