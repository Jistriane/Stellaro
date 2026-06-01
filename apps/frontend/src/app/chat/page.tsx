"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";
import { useWalletStore } from "@/state/wallet";

type Role = "user" | "assistant" | "system";
type Message = { role: Role; content: string; time: string };

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function ChatPage() {
  const t = useTranslations("chat");

  // Enable real-time updates when the wallet connects
  useRealTimeUpdates();

  const locale = useLocale();
  const address = useWalletStore((s) => s.address);
  const effectiveAddress = address ?? "";

  // Estado do chat
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: t("assistant_started", { name: effectiveAddress ? shortenAddress(effectiveAddress) : "—" }),
    time: nowTime(),
  }]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [elizaHealth, setElizaHealth] = useState<{ running: boolean; intervalMs: number | null } | null>(null);
  const [elizaConfig, setElizaConfig] = useState<Record<string, unknown> | null>(null);
  const [amountUSD, setAmountUSD] = useState<string>("100");
  const [asset, setAsset] = useState<string>("STLT");
  const [destination, setDestination] = useState<string>("");
  const [feedback, setFeedback] = useState<"up" | "down" | undefined>(undefined);
  const [feedbackComment, setFeedbackComment] = useState("");

  // Quick suggestions
  const quickSuggestions = useMemo(
    () => (t.raw("suggestions") as string[]) ?? [],
    [t]
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    let active = true;
    async function loadStatus() {
      try {
        const [healthRes, cfgRes] = await Promise.all([
          fetch(`${apiUrl}/eliza/health`, { cache: "no-store" }),
          fetch(`${apiUrl}/eliza/config`, { cache: "no-store" }),
        ]);
        if (!active) return;
        if (healthRes.ok) {
          setElizaHealth((await healthRes.json()) as any);
        } else {
          setElizaHealth(null);
        }
        if (cfgRes.ok) {
          const cfg = (await cfgRes.json()) as Record<string, unknown>;
          setElizaConfig(Object.keys(cfg || {}).length ? cfg : null);
        } else {
          setElizaConfig(null);
        }
      } catch {
        if (!active) return;
        setElizaHealth(null);
        setElizaConfig(null);
      }
    }
    loadStatus();
    return () => {
      active = false;
    };
  }, [effectiveAddress]);

  function nowTime() {
    try {
      return new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(new Date());
    } catch {
      return "";
    }
  }

  function shortenAddress(value: string) {
    if (!value) return value;
    if (value.length <= 10) return value;
    return `${value.slice(0, 6)}…${value.slice(-4)}`;
  }

  function pushMessage(role: Role, content: string) {
    setMessages((prev) => [...prev, { role, content, time: nowTime() }]);
  }

  async function onSend() {
    const value = text.trim();
    if (!value) return;
    pushMessage("user", value);
    setText("");
    await runAction("ping", { text: value });
  }

  function formatJson(value: unknown) {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  async function runAction(
    kind:
      | "risk-analysis"
      | "treasury-optimize"
      | "compliance-check"
      | "safe-optimization"
      | "transaction-compliance"
      | "monitor"
      | "ping",
    payload?: Record<string, unknown>,
  ) {
    const addr = (payload?.address as string | undefined) ?? effectiveAddress;
    const normalizedAmount = Number(amountUSD);

    if (
      ["risk-analysis", "treasury-optimize", "safe-optimization", "transaction-compliance", "monitor"].includes(kind) &&
      !addr
    ) {
      pushMessage("system", t("missing_wallet"));
      return;
    }

    setBusy(true);
    try {
      let res: Response;
      if (kind === "risk-analysis") {
        res = await fetch(`${apiUrl}/eliza/agents/risk-analysis/${encodeURIComponent(addr)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
      } else if (kind === "treasury-optimize") {
        res = await fetch(`${apiUrl}/eliza/agents/treasury-optimize/${encodeURIComponent(addr)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
      } else if (kind === "monitor") {
        res = await fetch(`${apiUrl}/eliza/agents/monitor/${encodeURIComponent(addr)}`, { cache: "no-store" });
      } else if (kind === "safe-optimization") {
        res = await fetch(`${apiUrl}/eliza/agents/orchestrate/safe-optimization`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ treasuryAddress: addr }),
        });
      } else if (kind === "transaction-compliance") {
        res = await fetch(`${apiUrl}/eliza/agents/orchestrate/transaction-compliance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userAddress: addr,
            amountUSD: Number.isFinite(normalizedAmount) ? normalizedAmount : 0,
            asset,
            destination: destination || undefined,
          }),
        });
      } else if (kind === "compliance-check") {
        res = await fetch(`${apiUrl}/eliza/agents/compliance-check`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userAddress: addr,
            amountUSD: Number.isFinite(normalizedAmount) ? normalizedAmount : 0,
            asset,
            destination: destination || undefined,
          }),
        });
      } else {
        res = await fetch(`${apiUrl}/eliza/health`, { cache: "no-store" });
      }

      const body = res.ok ? await res.json() : { ok: false, status: res.status, statusText: res.statusText };
      pushMessage("assistant", formatJson(body));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      pushMessage("system", `Erro: ${msg}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <Image src="/capa.png" alt="Stellaro background" fill priority sizes="100vw" className="object-cover object-center opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/85 to-background/60" />
      <div className="absolute inset-0 bg-[radial-gradient(1000px_circle_at_20%_15%,rgba(var(--stellaro-accent-rgb),0.14),transparent_60%),radial-gradient(900px_circle_at_80%_10%,rgba(197,135,230,0.10),transparent_55%)]" />
      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-8 p-6">
      
      {/* Header, greeting and status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary grid place-items-center text-primary-foreground font-bold">E</div>
          <div>
            <h1 className="text-xl font-semibold">{t("header_title")}</h1>
            <div className="text-xs text-muted-foreground">
              {t("status_online")}
            </div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">{t("hours")}</div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("conversation")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-sm">
            <div className="rounded border border-border/60 bg-secondary/10 px-3 py-2">
              <div className="text-xs text-muted-foreground">Wallet</div>
              <div className="font-medium">{effectiveAddress ? shortenAddress(effectiveAddress) : "—"}</div>
            </div>
            <div className="rounded border border-border/60 bg-secondary/10 px-3 py-2">
              <div className="text-xs text-muted-foreground">Eliza</div>
              <div className="font-medium">
                {elizaHealth ? (elizaHealth.running ? "running" : "stopped") : "unreachable"}
              </div>
            </div>
            <div className="rounded border border-border/60 bg-secondary/10 px-3 py-2">
              <div className="text-xs text-muted-foreground">Persona</div>
              <div className="font-medium">{String(elizaConfig?.name ?? "—")}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-sm">
            <div className="rounded border border-border/60 bg-secondary/10 px-3 py-2">
              <div className="text-xs text-muted-foreground">amountUSD</div>
              <input
                className="mt-1 w-full rounded bg-secondary/30 px-3 py-2 text-sm outline-none border border-border/60 text-foreground"
                value={amountUSD}
                onChange={(e) => setAmountUSD(e.target.value)}
                inputMode="decimal"
                placeholder="0"
                aria-label="amountUSD"
              />
            </div>
            <div className="rounded border border-border/60 bg-secondary/10 px-3 py-2">
              <div className="text-xs text-muted-foreground">asset</div>
              <input
                className="mt-1 w-full rounded bg-secondary/30 px-3 py-2 text-sm outline-none border border-border/60 text-foreground"
                value={asset}
                onChange={(e) => setAsset(e.target.value)}
                placeholder="STLT"
                aria-label="asset"
              />
            </div>
            <div className="rounded border border-border/60 bg-secondary/10 px-3 py-2">
              <div className="text-xs text-muted-foreground">destination (opcional)</div>
              <input
                className="mt-1 w-full rounded bg-secondary/30 px-3 py-2 text-sm outline-none border border-border/60 text-foreground"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="G..."
                aria-label="destination"
              />
            </div>
          </div>

          {/* Quick suggestions */}
          <div className="flex flex-wrap gap-2">
            {quickSuggestions.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setText(s);
                  pushMessage("user", s);
                  setText("");
                  void runAction("ping", { text: s });
                }}
                className="px-3 py-1.5 rounded bg-secondary/30 border border-border/60 text-xs"
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 text-sm">
            <button
              disabled={busy}
              onClick={() => void runAction("risk-analysis")}
              className="px-3 py-2 rounded bg-secondary/30 border border-border/60 text-foreground disabled:opacity-50"
            >
              Risk analysis
            </button>
            <button
              disabled={busy}
              onClick={() => void runAction("monitor")}
              className="px-3 py-2 rounded bg-secondary/30 border border-border/60 text-foreground disabled:opacity-50"
            >
              Monitor & mitigate
            </button>
            <button
              disabled={busy}
              onClick={() => void runAction("treasury-optimize")}
              className="px-3 py-2 rounded bg-secondary/30 border border-border/60 text-foreground disabled:opacity-50"
            >
              Treasury optimize
            </button>
            <button
              disabled={busy}
              onClick={() => void runAction("compliance-check")}
              className="px-3 py-2 rounded bg-secondary/30 border border-border/60 text-foreground disabled:opacity-50"
            >
              Compliance check
            </button>
            <button
              disabled={busy}
              onClick={() => void runAction("safe-optimization")}
              className="px-3 py-2 rounded bg-secondary/30 border border-border/60 text-foreground disabled:opacity-50"
            >
              Safe optimization
            </button>
            <button
              disabled={busy}
              onClick={() => void runAction("transaction-compliance")}
              className="px-3 py-2 rounded bg-secondary/30 border border-border/60 text-foreground disabled:opacity-50"
            >
              Transaction compliance
            </button>
          </div>

          {/* Message history */}
          <div ref={scrollRef} className="h-[420px] overflow-auto bg-card/50 border border-border/60 rounded p-3 space-y-3">
            {messages.map((m, idx) => (
              <div key={idx} className={`max-w-[85%] ${m.role === "user" ? "ml-auto text-foreground" : m.role === "assistant" ? "text-foreground" : "text-muted-foreground"}`}>
                <div className={`px-3 py-2 rounded border ${m.role === "user" ? "bg-primary/10 border-primary/25" : m.role === "assistant" ? "bg-secondary/20 border-border/60" : "bg-secondary/30 border-border/60"}`}>
                  <div className="text-xs opacity-70 mb-1">[{m.time}] {m.role === "user" ? (effectiveAddress ? shortenAddress(effectiveAddress) : "user") : m.role === "assistant" ? "eliza" : t("system_label")}</div>
                  <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                </div>
              </div>
            ))}
            {busy && (
              <div className="max-w-[85%] text-foreground">
                <div className="px-3 py-2 rounded border border-border/60 bg-secondary/20 text-xs">{t("typing")}</div>
              </div>
            )}
          </div>

          {/* Message input */}
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <div className="flex-1 flex gap-2">
              <input
                className="flex-1 rounded bg-secondary/30 px-3 py-2 text-sm outline-none border border-border/60 text-foreground"
                placeholder={t("placeholder")}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void onSend();
                  }
                }}
              />
              <button disabled={busy} onClick={() => void onSend()} className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
                {t("send")}
              </button>
            </div>
          </div>

          {/* Useful links */}
          <div className="flex flex-wrap gap-2 text-xs">
            <Link href="/help" className="px-3 py-1.5 rounded bg-secondary/30 border border-border/60">{t("links.help")}</Link>
            <Link href="/help" className="px-3 py-1.5 rounded bg-secondary/30 border border-border/60">{t("links.faq")}</Link>
            <Link href="/docs" className="px-3 py-1.5 rounded bg-secondary/30 border border-border/60">{t("links.articles")}</Link>
            <Link href="/pix" className="px-3 py-1.5 rounded bg-secondary/30 border border-border/60">{t("links.pix_status")}</Link>
          </div>

          {/* Security and Privacy */}
          <div className="text-xs text-primary bg-primary/10 border border-primary/25 rounded px-3 py-2">
            ⚠️ {t("privacy")} <Link href="/docs" className="underline">{t("privacy_link")}</Link>
          </div>

          {/* Service evaluation */}
          <div className="flex flex-col gap-2">
            <div className="text-xs text-muted-foreground">{t("feedback_title")}</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFeedback("up")}
                className={`px-2 py-1 rounded border text-sm ${feedback === "up" ? "bg-primary border-primary/30 text-primary-foreground" : "bg-secondary/30 border-border/60"}`}
              >👍</button>
              <button
                onClick={() => setFeedback("down")}
                className={`px-2 py-1 rounded border text-sm ${feedback === "down" ? "bg-primary border-primary/30 text-primary-foreground" : "bg-secondary/30 border-border/60"}`}
              >👎</button>
              {feedback && <span className="text-xs text-muted-foreground">{t("thanks")}</span>}
            </div>
            <input
              className="rounded bg-secondary/30 px-3 py-2 text-xs outline-none border border-border/60 text-foreground"
              placeholder={t("feedback_placeholder")}
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
            />
          </div>

          <div className="text-[10px] text-muted-foreground">{t("footnote")}</div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
