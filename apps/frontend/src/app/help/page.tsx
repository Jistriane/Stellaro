"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type QA = { q: string; a: string };
type Category = { key: string; title: string; qas: QA[] };

export default function HelpPage() {
  const t = useTranslations();
  // Busca
  const [query, setQuery] = useState("");
  const topQuestions = useMemo(
    () => [
      t("help.categories.account.qas.0.q"),
      t("help.categories.pix.qas.1.q"),
      t("help.categories.cards.qas.0.q"),
    ],
    [t]
  );

  // Mock de categorias e perguntas
  const categories: Category[] = useMemo(
    () => [
      {
        key: "account",
        title: t("help.categories.account.title"),
        qas: [0, 1, 2].map((i) => ({
          q: t(`help.categories.account.qas.${i}.q`),
          a: t(`help.categories.account.qas.${i}.a`),
        })),
      },
      {
        key: "pix",
        title: t("help.categories.pix.title"),
        qas: [0, 1, 2].map((i) => ({
          q: t(`help.categories.pix.qas.${i}.q`),
          a: t(`help.categories.pix.qas.${i}.a`),
        })),
      },
      {
        key: "cards",
        title: t("help.categories.cards.title"),
        qas: [0, 1, 2].map((i) => ({
          q: t(`help.categories.cards.qas.${i}.q`),
          a: t(`help.categories.cards.qas.${i}.a`),
        })),
      },
      {
        key: "kyc",
        title: t("help.categories.kyc.title"),
        qas: [0, 1, 2].map((i) => ({
          q: t(`help.categories.kyc.qas.${i}.q`),
          a: t(`help.categories.kyc.qas.${i}.a`),
        })),
      },
      {
        key: "gov",
        title: t("help.categories.gov.title"),
        qas: [0, 1, 2].map((i) => ({
          q: t(`help.categories.gov.qas.${i}.q`),
          a: t(`help.categories.gov.qas.${i}.a`),
        })),
      },
      {
        key: "tokens",
        title: t("help.categories.tokens.title"),
        qas: [0, 1, 2].map((i) => ({
          q: t(`help.categories.tokens.qas.${i}.q`),
          a: t(`help.categories.tokens.qas.${i}.a`),
        })),
      },
    ],
    [t]
  );

  // Feedback por pergunta
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

  // Status dos serviços (mock)
  const status = { pix: "OK", cards: "OK", platform: "OK" } as const;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("help.title")}</h1>
        <div className="text-xs text-slate-500">{t("help.subtitle")}</div>
      </div>

      {/* Busca e top perguntas */}
      <Card>
        <CardHeader>
          <CardTitle>{t("help.search_title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("help.search_placeholder")}
            className="w-full rounded bg-slate-900 px-4 py-3 border border-slate-800 text-sm"
          />
          <div className="text-xs text-slate-400">{t("help.popular")}</div>
          <div className="flex flex-wrap gap-2">
            {topQuestions.map((tq) => (
              <button key={tq} onClick={() => setQuery(tq)} className="px-3 py-1.5 rounded bg-slate-800 text-xs">
                {tq}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status dos serviços */}
      <Card>
        <CardHeader>
          <CardTitle>{t("help.status_title")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 text-sm">
          <span className="px-2 py-1 rounded bg-emerald-900/40 text-emerald-300">Pix: {status.pix}</span>
          <span className="px-2 py-1 rounded bg-emerald-900/40 text-emerald-300">Cartões: {status.cards}</span>
          <span className="px-2 py-1 rounded bg-emerald-900/40 text-emerald-300">Plataforma: {status.platform}</span>
          <div className="text-xs text-slate-500">{t("help.status_incidents")}</div>
        </CardContent>
      </Card>

      {/* FAQ por categoria (accordions) */}
      <Card>
        <CardHeader>
          <CardTitle>{t("help.faq_title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {filtered.map((cat) => (
            <div key={cat.key} className="bg-slate-900 rounded p-3">
              <div className="font-medium mb-2">{cat.title}</div>
              <div className="space-y-2">
                {cat.qas.map((qa, idx) => {
                  const qKey = `${cat.key}-${idx}`;
                  const fb = feedback[qKey];
                  return (
                    <details key={qKey} className="rounded border border-slate-800">
                      <summary className="cursor-pointer select-none list-none px-3 py-2 bg-slate-800/60">
                        {qa.q}
                      </summary>
                      <div className="px-3 py-2 space-y-2">
                        <div className="text-slate-300">{qa.a}</div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-500">{t("help.helpful")}</span>
                          <button
                            onClick={() => setQFeedback(qKey, "up")}
                            className={`px-2 py-1 rounded ${fb === "up" ? "bg-primary text-black" : "bg-slate-800"}`}
                          >👍</button>
                          <button
                            onClick={() => setQFeedback(qKey, "down")}
                            className={`px-2 py-1 rounded ${fb === "down" ? "bg-primary text-black" : "bg-slate-800"}`}
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
            <div className="text-xs text-slate-500">{t("help.no_results")}</div>
          )}
        </CardContent>
      </Card>

      {/* Tutoriais e vídeos */}
      <Card>
        <CardHeader>
          <CardTitle>{t("help.tutorials_title")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 text-sm">
          <a href="/pix" className="px-3 py-2 rounded bg-slate-800">{t("help.tutorials_pix")}</a>
          <a href="/cards" className="px-3 py-2 rounded bg-slate-800">{t("help.tutorials_cards")}</a>
          <a href="/help" className="px-3 py-2 rounded bg-slate-800">{t("help.tutorials_denied")}</a>
          <a href="/docs" className="px-3 py-2 rounded bg-slate-800">{t("help.tutorials_docs")}</a>
        </CardContent>
      </Card>

      {/* Suporte direto */}
      <Card>
        <CardHeader>
          <CardTitle>{t("help.support_title")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 text-sm items-center">
          <a href="/chat" className="px-3 py-2 rounded bg-primary text-black">{t("help.open_chat")}</a>
          <a href="mailto:suporte@stelato.app" className="px-3 py-2 rounded bg-slate-800">{t("help.email")}</a>
          <a href="https://api.whatsapp.com/send?phone=5500000000000" target="_blank" rel="noopener noreferrer" className="px-3 py-2 rounded bg-slate-800">{t("help.whatsapp")}</a>
          <a href="https://t.me/stelato_suporte" target="_blank" rel="noopener noreferrer" className="px-3 py-2 rounded bg-slate-800">{t("help.telegram")}</a>
          <span className="text-xs text-slate-500 ml-2">{t("help.hours")}</span>
          <div className="text-xs text-slate-500 w-full">{t("help.protocol")}</div>
        </CardContent>
      </Card>

      {/* Dicas de segurança */}
      <Card>
        <CardHeader>
          <CardTitle>{t("help.security_title")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <ul className="list-disc pl-6 space-y-1 text-slate-300">
            <li>{t("help.sec_tip1")}</li>
            <li>{t("help.sec_tip2")}</li>
            <li>{t("help.sec_tip3")}</li>
            <li>{t("help.sec_tip4")}</li>
          </ul>
          <div className="text-xs text-slate-500 mt-2">{t("help.fraud_docs")} <a href="/docs" className="underline">Docs</a>.</div>
        </CardContent>
      </Card>

      {/* Acesso rápido */}
      <Card>
        <CardHeader>
          <CardTitle>{t("help.quick_access_title")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 text-sm">
          <a href="/login" className="px-3 py-2 rounded bg-slate-800">{t("help.recover_account")}</a>
          <a href="/help" className="px-3 py-2 rounded bg-slate-800">{t("help.report_suspicious")}</a>
          <a href="/cards" className="px-3 py-2 rounded bg-slate-800">{t("help.cancel_card")}</a>
        </CardContent>
      </Card>
    </div>
  );
}
