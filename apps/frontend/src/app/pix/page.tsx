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
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-transparent px-4 py-6 sm:px-6 lg:px-8 notranslate" translate="no">
      <Image
        src="/capa.png"
        alt="Stellaro background"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center opacity-30"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-background/75" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(var(--stellaro-accent-rgb),0.14),transparent_28%),radial-gradient(circle_at_82%_82%,rgba(197,135,230,0.10),transparent_24%)]" />

      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-8">
        <header className="grid gap-6 rounded-[2rem] border border-border/60 bg-card/50 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 rounded-full border border-border/70 bg-card/40 px-4 py-2 backdrop-blur-sm">
              <Image src="/logo.png" alt="Stellaro logo" width={48} height={48} className="h-10 w-10 rounded-md object-contain" />
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.35em] text-muted-foreground">PIX</p>
                <p className="text-sm text-foreground">Deposits and withdrawals with a branded fintech shell</p>
              </div>
            </div>

            <div className="max-w-3xl space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">{t("header.title")}</h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">{t("header.subtitle")}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/60 bg-secondary/20 p-4">
                <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Deposit</p>
                <p className="mt-3 text-sm leading-6 text-foreground">Copy your temporary key or generate a QR payload.</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-secondary/20 p-4">
                <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Withdraw</p>
                <p className="mt-3 text-sm leading-6 text-foreground">Request transfers to PIX keys with transparent limits.</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-secondary/20 p-4">
                <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Status</p>
                <p className="mt-3 text-sm leading-6 text-foreground">Operational status and recent history at a glance.</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-border/40 bg-card/40 p-6 backdrop-blur-md">
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-muted-foreground">Service</p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <span className={`rounded-full px-3 py-1 text-xs ${service.status === "Available" ? "bg-primary/10 text-primary border border-primary/20" : service.status === "Maintenance" ? "bg-secondary/20 text-muted-foreground border border-border/60" : "bg-destructive/10 text-destructive border border-destructive/30"}`}>
                {service.status === "Available" ? t("service.available") : service.status === "Maintenance" ? t("service.maintenance") : t("service.unavailable")}
              </span>
              <span className="text-muted-foreground">{service.note}</span>
            </div>
            <div className="mt-6 rounded-2xl border border-border/60 bg-secondary/20 p-4 text-sm text-foreground">
              <div className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Wallet</div>
              <div className="mt-2">R$ {wallet.balanceBRL.toLocaleString("en-US", { maximumFractionDigits: 2 })} available</div>
              <div className="mt-1 text-xs text-muted-foreground">XLM: {walletData.xlm} • STLT: {walletData.stlt}</div>
              <div className="mt-1 text-xs text-muted-foreground">Daily limit: R$ {wallet.dailyLimitBRL.toLocaleString("en-US")}</div>
              {walletAddress ? <div className="mt-1 text-[11px] break-all text-muted-foreground">{walletAddress}</div> : null}
              {walletLoading ? <div className="mt-1 text-xs text-muted-foreground">Loading wallet data...</div> : null}
              {walletError ? <div className="mt-1 text-xs text-destructive">{walletError}</div> : null}
            </div>
          </div>
        </header>

        {/* Deposit/Withdraw tabs */}
        <Card className="border-border/60 bg-card/50 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          <CardHeader>
            <CardTitle>{t("ops.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 text-sm mb-4 flex-wrap">
              <button onClick={() => setTab("deposit")} className={`px-3 py-2 rounded-full border ${tab === "deposit" ? "border-primary/30 bg-primary/10 text-foreground" : "border-border/60 bg-secondary/20 text-muted-foreground"}`}>{t("ops.deposit")}</button>
              <button onClick={() => setTab("withdraw")} className={`px-3 py-2 rounded-full border ${tab === "withdraw" ? "border-primary/30 bg-primary/10 text-foreground" : "border-border/60 bg-secondary/20 text-muted-foreground"}`}>{t("ops.withdraw")}</button>
            </div>

            {tab === "deposit" ? (
              <div className="space-y-4">
                <div className="text-sm">{t("deposit.how_much")}</div>
                <input
                  value={amountDep}
                  onChange={(e) => setAmountDep(e.target.value)}
                  placeholder={t("deposit.placeholder_amount")}
                  className="w-full max-w-xs rounded-xl bg-secondary/30 px-3 py-2 text-sm outline-none border border-border/60 text-foreground placeholder:text-muted-foreground"
                  inputMode="decimal"
                />

                <div className="text-xs text-muted-foreground">{t("deposit.auto_credit")}</div>

                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">{t("deposit.temp_key")}</div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="rounded-xl bg-secondary/30 px-3 py-2 text-sm select-all border border-border/60 text-foreground">{pixKey || "Connect wallet to generate key"}</div>
                    <button onClick={onCopy} disabled={!pixKey} className="px-3 py-2 rounded-full border border-border/60 bg-secondary/20 text-foreground text-xs disabled:opacity-50 disabled:cursor-not-allowed">{copied ? t("deposit.copied") : t("deposit.copy")}</button>
                    <button onClick={onGenerateQR} disabled={!pixKey} className="px-3 py-2 rounded-full border border-border/60 bg-secondary/20 text-foreground text-xs disabled:opacity-50 disabled:cursor-not-allowed">Generate payload</button>
                  </div>
                  <div className="mt-1 rounded-2xl bg-secondary/20 border border-border/60 p-3 text-[11px] text-muted-foreground whitespace-pre-wrap break-all min-h-28">{qrPayload || "Generate a payload to render with your QR provider."}</div>
                </div>

                <div className="text-xs text-muted-foreground">
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
                  className="w-full max-w-xs rounded-xl bg-secondary/30 px-3 py-2 text-sm outline-none border border-border/60 text-foreground placeholder:text-muted-foreground"
                  inputMode="decimal"
                />
                <div className="text-sm">{t("withdraw.to_which_key")}</div>
                <input
                  value={destKey}
                  onChange={(e) => setDestKey(e.target.value)}
                  placeholder={t("withdraw.placeholder_key")}
                  className="w-full max-w-lg rounded-xl bg-secondary/30 px-3 py-2 text-sm outline-none border border-border/60 text-foreground placeholder:text-muted-foreground"
                />
                <div className="text-xs text-muted-foreground">{t("withdraw.balances", { balance: wallet.balanceBRL.toLocaleString("en-US", { maximumFractionDigits: 2 }), daily: wallet.dailyLimitBRL.toLocaleString("en-US"), fee: wallet.feePct })}</div>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={onRequestWithdraw} className="px-3 py-2 rounded-full bg-primary text-primary-foreground text-sm">{t("withdraw.request")}</button>
                  <button onClick={() => confirm("OK?") && onRequestWithdraw()} className="px-3 py-2 rounded-full border border-border/60 bg-secondary/20 text-foreground text-sm">{t("withdraw.confirm")}</button>
                </div>
                <div className="text-xs text-muted-foreground">Requests are prepared from your connected wallet context.</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/50 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          <CardHeader>
            <CardTitle>{t("x402.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{t("x402.subtitle")}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className={`rounded-full px-3 py-1 ${x402Status.mode === "live" ? "bg-primary/10 text-primary border border-primary/20" : x402Status.mode === "stub" ? "bg-secondary/20 text-muted-foreground border border-border/60" : "bg-destructive/10 text-destructive border border-destructive/30"}`}>
                    {t(`x402.mode_${x402Status.mode}`)}
                  </span>
                  <span className="rounded-full border border-border/60 bg-secondary/20 px-3 py-1 text-muted-foreground">{t("x402.network")}: {x402Status.network}</span>
                  <span className="rounded-full border border-border/60 bg-secondary/20 px-3 py-1 text-muted-foreground">{t("x402.asset")}: {x402Status.acceptedAsset}</span>
                </div>
                <div className="rounded-2xl border border-border/60 bg-secondary/20 p-4 text-sm text-muted-foreground space-y-2">
                  <div>{t("x402.resource")}: <span className="text-foreground">{x402Status.resource}</span></div>
                  <div>{t("x402.provider")}: <span className="text-foreground">{x402Status.providerContractId || "stub-provider-contract"}</span></div>
                  <div>{t("x402.facilitator")}: <span className="text-foreground break-all">{x402Status.facilitatorUrl || "https://facilitator.stellaro.local"}</span></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={onGenerateX402Quote}
                    disabled={!x402Status.enabled || x402Loading}
                    className={`px-3 py-2 rounded-full text-sm ${!x402Status.enabled || x402Loading ? "bg-secondary/20 text-muted-foreground cursor-not-allowed" : "bg-primary text-primary-foreground"}`}
                  >
                    {x402Loading ? t("x402.loading") : t("x402.generate")}
                  </button>
                  <Link href="/docs" className="px-3 py-2 rounded-full border border-border/60 bg-secondary/20 text-foreground text-sm">
                    {t("x402.docs")}
                  </Link>
                </div>
                {x402Error ? <p className="text-sm text-destructive">{x402Error}</p> : null}
              </div>

              <div className="rounded-2xl border border-border/60 bg-secondary/20 p-4 text-sm text-muted-foreground">
                {x402Quote ? (
                  <div className="space-y-2">
                    <div><span className="text-muted-foreground">{t("x402.quote_id")}:</span> <span className="text-foreground break-all">{x402Quote.sessionId}</span></div>
                    <div><span className="text-muted-foreground">{t("x402.quote_total")}:</span> <span className="text-foreground">{x402Quote.settlement.total} {x402Quote.settlement.asset}</span></div>
                    <div><span className="text-muted-foreground">{t("x402.quote_expires")}:</span> <span className="text-foreground">{new Date(x402Quote.settlement.expiresAt).toLocaleString("en-US")}</span></div>
                    <div><span className="text-muted-foreground">{t("x402.quote_url")}:</span> <span className="text-foreground break-all">{x402Quote.headers["x402-payment-url"]}</span></div>
                    <div><span className="text-muted-foreground">{t("x402.quote_wallet")}:</span> <span className="text-foreground">{x402Quote.settlement.walletAddress || "not provided"}</span></div>
                    <div><span className="text-muted-foreground">{t("x402.quote_memo")}:</span> <span className="text-foreground break-all">{x402Quote.settlement.memo}</span></div>
                    <p className="pt-2 text-xs text-muted-foreground">{x402Quote.guidance}</p>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">{t("x402.empty")}</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/50 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          <CardHeader>
            <CardTitle>{t("etherfuse.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{t("etherfuse.subtitle")}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className={`rounded-full px-3 py-1 ${etherfuseStatus.mode === "live" ? "bg-primary/10 text-primary border border-primary/20" : etherfuseStatus.mode === "stub" ? "bg-secondary/20 text-muted-foreground border border-border/60" : "bg-destructive/10 text-destructive border border-destructive/30"}`}>
                    {t(`etherfuse.mode_${etherfuseStatus.mode}`)}
                  </span>
                  <span className="rounded-full border border-border/60 bg-secondary/20 px-3 py-1 text-muted-foreground">{t("etherfuse.network")}: {etherfuseStatus.blockchain}</span>
                  <span className="rounded-full border border-border/60 bg-secondary/20 px-3 py-1 text-muted-foreground">{t("etherfuse.quote_type")}: {etherfuseStatus.defaultQuoteType}</span>
                </div>

                <div className="rounded-2xl border border-border/60 bg-secondary/20 p-4 text-sm text-muted-foreground space-y-2">
                  <div>{t("etherfuse.api")}: <span className="text-foreground break-all">{etherfuseStatus.apiBaseUrl}</span></div>
                  <div>{t("etherfuse.source_asset")}: <span className="text-foreground break-all">{etherfuseStatus.defaultSourceAsset}</span></div>
                  <div>{t("etherfuse.target_asset")}: <span className="text-foreground break-all">{etherfuseStatus.defaultTargetAsset}</span></div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={onGenerateEtherfuseQuote}
                    disabled={!etherfuseStatus.enabled || etherfuseLoading}
                    className={`px-3 py-2 rounded-full text-sm ${!etherfuseStatus.enabled || etherfuseLoading ? "bg-secondary/20 text-muted-foreground cursor-not-allowed" : "bg-primary text-primary-foreground"}`}
                  >
                    {etherfuseLoading ? t("etherfuse.loading") : t("etherfuse.generate")}
                  </button>
                  <Link href="/docs" className="px-3 py-2 rounded-full border border-border/60 bg-secondary/20 text-foreground text-sm">
                    {t("etherfuse.docs")}
                  </Link>
                  <button
                    onClick={onCreateEtherfuseOrder}
                    disabled={!etherfuseQuote || etherfuseOrderLoading}
                    className={`px-3 py-2 rounded-full text-sm ${!etherfuseQuote || etherfuseOrderLoading ? "bg-secondary/20 text-muted-foreground cursor-not-allowed" : "border border-border/60 bg-secondary/20 text-foreground"}`}
                  >
                    {etherfuseOrderLoading ? t("etherfuse.order_loading") : t("etherfuse.order_create")}
                  </button>
                </div>

                {etherfuseError ? <p className="text-sm text-destructive">{etherfuseError}</p> : null}
              </div>

              <div className="rounded-2xl border border-border/60 bg-secondary/20 p-4 text-sm text-muted-foreground">
                {etherfuseQuote ? (
                  <div className="space-y-2">
                    <div><span className="text-muted-foreground">{t("etherfuse.quote_id")}:</span> <span className="text-foreground break-all">{etherfuseQuote.id}</span></div>
                    <div><span className="text-muted-foreground">{t("etherfuse.quote_source")}:</span> <span className="text-foreground">{etherfuseQuote.sourceAmount} {etherfuseQuote.sourceAsset}</span></div>
                    <div><span className="text-muted-foreground">{t("etherfuse.quote_destination")}:</span> <span className="text-foreground">{etherfuseQuote.destinationAmount} {etherfuseQuote.targetAsset}</span></div>
                    <div><span className="text-muted-foreground">{t("etherfuse.quote_rate")}:</span> <span className="text-foreground">{etherfuseQuote.exchangeRate}</span></div>
                    <div><span className="text-muted-foreground">{t("etherfuse.quote_expires")}:</span> <span className="text-foreground">{new Date(etherfuseQuote.expiresAt).toLocaleString("en-US")}</span></div>
                    <p className="pt-2 text-xs text-muted-foreground">{etherfuseQuote.guidance}</p>
                    {etherfuseOrder ? (
                      <div className="mt-3 rounded-xl border border-primary/20 bg-primary/10 p-3 text-xs text-foreground space-y-1">
                        <div>{t("etherfuse.order_id")}: <span className="break-all">{etherfuseOrder.id}</span></div>
                        <div>{t("etherfuse.order_status")}: {etherfuseOrder.status}</div>
                        <div>{t("etherfuse.order_direction")}: {etherfuseOrder.direction}</div>
                        <p className="text-muted-foreground">{etherfuseOrder.guidance}</p>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">{t("etherfuse.empty")}</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pix transaction history */}
        <Card className="border-border/60 bg-card/50 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          <CardHeader>
            <CardTitle>{t("history.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="text-sm text-muted-foreground">Loading testnet history...</div>
            ) : history.length === 0 ? (
              <div className="text-sm text-muted-foreground">{t("history.empty")}</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {history.map((tItem, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-border/60 bg-secondary/20 px-3 py-2">
                    <div className="text-foreground">{tItem.type === "Deposit" ? t("history.type_deposit") : t("history.type_withdraw")} • {tItem.value} {tItem.asset}</div>
                    <div className="text-xs text-muted-foreground">{tItem.date} • {t("history.status_done")} • {tItem.key}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alerts and important messages */}
        <Card className="border-border/60 bg-card/50 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          <CardHeader>
            <CardTitle>{t("alerts.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 text-sm space-y-1 text-primary">
              <li>{t("alerts.a1")}</li>
              <li>{t("alerts.a2")}</li>
              <li>{t("alerts.a3")}</li>
            </ul>
          </CardContent>
        </Card>

        {/* Help and support */}
        <Card className="border-border/60 bg-card/50 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          <CardHeader>
            <CardTitle>{t("help.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 text-sm">
              <Link href="/docs" className="px-3 py-2 rounded-full border border-border/60 bg-secondary/20 text-foreground">{t("help.faq_pix")}</Link>
              <Link href="/help" className="px-3 py-2 rounded-full border border-border/60 bg-secondary/20 text-foreground">{t("help.support")}</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
