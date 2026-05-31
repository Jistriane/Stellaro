"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type QA = { q: string; a: string };
type Category = { key: string; title: string; qas: QA[] };

export default function HelpPage() {
  const t = useTranslations("help");
  // Search
  const [query, setQuery] = useState("");
  const topQuestions = useMemo(
    () => [
      t("categories.account.qas.0.q"),
      t("categories.pix.qas.1.q"),
      t("categories.cards.qas.0.q"),
    ],
    [t]
  );

  // Mock categories and questions from translations
  const categories: Category[] = useMemo(() => {
    // Function to fetch questions and answers directly from JSON
    const getQas = (categoryKey: string) => {
      try {
        const categoryData = (t.raw(`categories.${categoryKey}`) as any);
        return categoryData.qas || [];
      } catch {
        return [];
      }
    };

    return [
      {
        key: "account",
        title: t("categories.account.title"),
        qas: getQas("account"),
      },
      {
        key: "pix",
        title: t("categories.pix.title"),
        qas: getQas("pix"),
      },
      {
        key: "cards",
        title: t("categories.cards.title"),
        qas: getQas("cards"),
      },
      {
        key: "kyc",
        title: t("categories.kyc.title"),
        qas: getQas("kyc"),
      },
      {
        key: "gov",
        title: t("categories.gov.title"),
        qas: getQas("gov"),
      },
      {
        key: "tokens",
        title: t("categories.tokens.title"),
        qas: getQas("tokens"),
      },
    ];
  }, [t]);

  // Per-question feedback
  const [feedback, setFeedback] = useState<Record<string, "up" | "down" | undefined>>({});
  const setQFeedback = (key: string, dir: "up" | "down") => setFeedback((f) => ({ ...f, [key]: dir }));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories
      .map((c) => ({
        ...c,
        qas: c.qas.filter((qa) => qa.q.toLowerCase().includes(q) || qa.a.toLowerCase().includes(q)),
      }))
      .filter((c) => c.qas.length > 0);
  }, [categories, query]);

  // Service status (mock)
  const status = { pix: "OK", cards: "OK", platform: "OK" } as const;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <Image
        src="/capa.png"
        alt="Stellaro background"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center opacity-25"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/85 to-background/60" />
      <div className="absolute inset-0 bg-[radial-gradient(1000px_circle_at_20%_15%,rgba(var(--stellaro-accent-rgb),0.14),transparent_60%),radial-gradient(900px_circle_at_80%_10%,rgba(197,135,230,0.10),transparent_55%)]" />

      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-8">
        <header className="grid gap-6 rounded-[2rem] border border-border/60 bg-card/50 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur-md lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 rounded-full border border-border/60 bg-secondary/20 px-4 py-2 backdrop-blur-sm">
              <Image src="/logo.png" alt="Stellaro logo" width={48} height={48} className="h-10 w-10 rounded-md object-contain" />
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Support</p>
                <p className="text-sm text-foreground">Help center and operational guidance</p>
              </div>
            </div>

            <div className="max-w-3xl space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">{t("title")}</h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">{t("subtitle")}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/60 bg-card/40 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Search</p>
                <p className="mt-3 text-sm leading-6 text-foreground">Find answers across account, payments, cards and compliance.</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card/40 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Support</p>
                <p className="mt-3 text-sm leading-6 text-foreground">Chat, e-mail and external channels are one click away.</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card/40 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Security</p>
                <p className="mt-3 text-sm leading-6 text-foreground">Tips for protecting access, wallets and recovery flow.</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-border/60 bg-card/50 p-6 backdrop-blur-md">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">System</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{t("status_title")}</p>
              </div>
              <div className="h-14 w-14 rounded-2xl border border-border/60 bg-secondary/20 p-2">
                <Image src="/logo.png" alt="Stellaro" width={56} height={56} className="h-full w-full object-contain" />
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3 text-sm">
              <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-primary">Pix: {status.pix}</span>
              <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-primary">Cards: {status.cards}</span>
              <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-primary">Platform: {status.platform}</span>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">{t("status_incidents")}</p>
          </div>
        </header>

      {/* Search and top questions */}
      <Card className="border-border/60 bg-card/50 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
        <CardHeader>
          <CardTitle>{t("search_title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search_placeholder")}
            className="w-full rounded-xl bg-secondary/30 px-4 py-3 border border-border/60 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60"
          />
          <div className="text-xs text-muted-foreground">{t("popular")}</div>
          <div className="flex flex-wrap gap-2">
            {topQuestions.map((tq) => (
              <button key={tq} onClick={() => setQuery(tq)} className="px-3 py-1.5 rounded-full border border-border/60 bg-secondary/20 text-xs text-foreground transition-colors hover:border-primary/40 hover:bg-secondary/30">
                {tq}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FAQ by category (accordions) */}
      <Card className="border-border/60 bg-card/50 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
        <CardHeader>
          <CardTitle>{t("faq_title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {filtered.map((cat) => (
            <div key={cat.key} className="rounded-2xl border border-border/60 bg-card/40 p-3">
              <div className="font-medium mb-2">{cat.title}</div>
              <div className="space-y-2">
                {cat.qas.map((qa, idx) => {
                  const qKey = `${cat.key}-${idx}`;
                  const fb = feedback[qKey];
                  return (
                    <details key={qKey} className="rounded-xl border border-border/60 bg-card/50">
                      <summary className="cursor-pointer select-none list-none px-3 py-2 bg-secondary/20 rounded-xl">
                        {qa.q}
                      </summary>
                      <div className="px-3 py-2 space-y-2">
                        <div className="text-muted-foreground">{qa.a}</div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">{t("helpful")}</span>
                          <button
                            onClick={() => setQFeedback(qKey, "up")}
                            className={`px-2 py-1 rounded border ${fb === "up" ? "bg-primary border-primary/30 text-primary-foreground" : "bg-secondary/30 border-border/60 text-foreground"}`}
                          >👍</button>
                          <button
                            onClick={() => setQFeedback(qKey, "down")}
                            className={`px-2 py-1 rounded border ${fb === "down" ? "bg-primary border-primary/30 text-primary-foreground" : "bg-secondary/30 border-border/60 text-foreground"}`}
                          >👎</button>
                        </div>
                      </div>
                    </details>
                  );
                })}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-xs text-muted-foreground">{t("no_results")}</div>
          )}
        </CardContent>
      </Card>

      {/* Tutorials and videos */}
          <Card className="border-border/60 bg-card/50 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
        <CardHeader>
          <CardTitle>{t("tutorials_title")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 text-sm">
              <Link href="/pix" className="px-3 py-2 rounded-full border border-border/60 bg-secondary/20 transition-colors hover:border-primary/40">{t("tutorials_pix")}</Link>
              <Link href="/cards" className="px-3 py-2 rounded-full border border-border/60 bg-secondary/20 transition-colors hover:border-primary/40">{t("tutorials_cards")}</Link>
              <Link href="/help" className="px-3 py-2 rounded-full border border-border/60 bg-secondary/20 transition-colors hover:border-primary/40">{t("tutorials_denied")}</Link>
              <Link href="/docs" className="px-3 py-2 rounded-full border border-border/60 bg-secondary/20 transition-colors hover:border-primary/40">{t("tutorials_docs")}</Link>
        </CardContent>
      </Card>

      {/* Suporte direto */}
          <Card className="border-border/60 bg-card/50 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
        <CardHeader>
          <CardTitle>{t("support_title")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 text-sm items-center">
              <Link href="/chat" className="px-3 py-2 rounded-full bg-primary text-primary-foreground">{t("open_chat")}</Link>
              <a href="mailto:suporte@stelato.app" className="px-3 py-2 rounded-full border border-border/60 bg-secondary/20">{t("email")}</a>
              <a href="https://api.whatsapp.com/send?phone=5500000000000" target="_blank" rel="noopener noreferrer" className="px-3 py-2 rounded-full border border-border/60 bg-secondary/20">{t("whatsapp")}</a>
              <a href="https://t.me/stelato_suporte" target="_blank" rel="noopener noreferrer" className="px-3 py-2 rounded-full border border-border/60 bg-secondary/20">{t("telegram")}</a>
          <span className="text-xs text-muted-foreground ml-2">{t("hours")}</span>
          <div className="text-xs text-muted-foreground w-full">{t("protocol")}</div>
        </CardContent>
      </Card>

      {/* Security tips */}
          <Card className="border-border/60 bg-card/50 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
        <CardHeader>
          <CardTitle>{t("security_title")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
            <li>{t("sec_tip1")}</li>
            <li>{t("sec_tip2")}</li>
            <li>{t("sec_tip3")}</li>
            <li>{t("sec_tip4")}</li>
          </ul>
          <div className="text-xs text-muted-foreground mt-2">{t("fraud_docs")} <Link href="/docs" className="underline">Docs</Link>.</div>
        </CardContent>
      </Card>

      {/* Quick access */}
      <Card className="border-border/60 bg-card/50 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
        <CardHeader>
          <CardTitle>{t("quick_access_title")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 text-sm">
          <Link href="/login" className="px-3 py-2 rounded-full border border-border/60 bg-secondary/20">{t("recover_account")}</Link>
          <Link href="/help" className="px-3 py-2 rounded-full border border-border/60 bg-secondary/20">{t("report_suspicious")}</Link>
          <Link href="/cards" className="px-3 py-2 rounded-full border border-border/60 bg-secondary/20">{t("cancel_card")}</Link>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
