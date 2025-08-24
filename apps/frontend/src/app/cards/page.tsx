"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";

type CardItem = {
  id: string;
  holder: string;
  type: "Virtual" | "Físico";
  status: "Ativo" | "Bloqueado" | "Pendente" | "Cancelado";
  masked: string; // 1234 **** **** 9876
  number: string; // 16 dígitos
  expiry: string; // MM/YY
  cvv: string;
  balance: number; // saldo atrelado ao cartão (mock)
  dailyLimit: number;
};

export default function CardsPage() {
  const t = useTranslations("cards");
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({});
  const [cards, setCards] = useState<CardItem[]>([
    {
      id: "c1",
      holder: "Jistriane Silva",
      type: "Virtual",
      status: "Ativo",
      masked: "1234 **** **** 9876",
      number: "1234 5678 9012 9876",
      expiry: "12/28",
      cvv: "842",
      balance: 2200,
      dailyLimit: 1000,
    },
    {
      id: "c2",
      holder: "Jistriane Silva",
      type: "Físico",
      status: "Pendente",
      masked: "2233 **** **** 4455",
      number: "2233 9900 1100 4455",
      expiry: "08/29",
      cvv: "315",
      balance: 800,
      dailyLimit: 1500,
    },
  ]);

  const transactions = useMemo(
    () => [
      { date: "2025-08-13 09:40", value: 100, merchant: "Uber", status: "Aprovado", intl: false },
      { date: "2025-08-12 18:05", value: 250, merchant: "Mercado", status: "Aprovado", intl: false },
      { date: "2025-08-10 22:11", value: 8, merchant: "Online", status: "Negado", intl: true },
    ],
    []
  );

  function toggleDetails(id: string) {
    setShowDetails((s) => ({ ...s, [id]: !s[id] }));
  }

  function onCopy(text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    // feedback via título do botão
  }

  function toggleBlock(id: string) {
    setCards((list) =>
      list.map((c) =>
        c.id === id
          ? { ...c, status: c.status === "Bloqueado" ? "Ativo" : "Bloqueado" }
          : c
      )
    );
  }

  function requestNewCard(kind: "Virtual" | "Físico") {
    const kindKey = kind === "Virtual" ? t("card.type_virtual") : t("card.type_physical");
    alert(t("actions.request_sent", { kind: kindKey }));
  }

  function typeLabel(type: "Virtual" | "Físico") {
    return type === "Virtual" ? t("card.type_virtual") : t("card.type_physical");
  }

  function statusLabel(status: "Ativo" | "Bloqueado" | "Pendente" | "Cancelado") {
    switch (status) {
      case "Ativo":
        return t("card.status_active");
      case "Bloqueado":
        return t("card.status_blocked");
      case "Pendente":
        return t("card.status_pending");
      case "Cancelado":
        return t("card.status_canceled");
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("header.title")}</h1>
        <div className="text-xs text-slate-500">{t("header.subtitle")}</div>
      </div>

      {/* Resumo dos Cartões */}
      <Card>
        <CardHeader>
          <CardTitle>{t("summary.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 text-sm">
            <button onClick={() => requestNewCard("Virtual")} className="px-3 py-2 rounded bg-primary text-black">{t("summary.request_virtual")}</button>
            <button onClick={() => requestNewCard("Físico")} className="px-3 py-2 rounded bg-slate-800 text-slate-200">{t("summary.request_physical")}</button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {cards.map((c) => (
              <div key={c.id} className="rounded border border-slate-800">
                {/* Visual estilizado do cartão */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-t p-4 relative overflow-hidden">
                  <div className="text-xs text-slate-400">{typeLabel(c.type)} • {statusLabel(c.status)}</div>
                  <div className="mt-1 text-lg tracking-wider">{c.masked}</div>
                  <div className="text-xs text-slate-400 mt-1">{c.holder}</div>
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full opacity-20 bg-primary" />
                </div>

                {/* Ações rápidas */}
                <div className="p-4 space-y-3">
                  <div className="flex flex-wrap gap-2 text-sm">
                    <button onClick={() => toggleDetails(c.id)} className="px-3 py-2 rounded bg-slate-800 text-slate-200">
                      {showDetails[c.id] ? t("card.hide_data") : t("card.show_data")}
                    </button>
                    <button onClick={() => toggleBlock(c.id)} className="px-3 py-2 rounded bg-slate-800 text-slate-200">
                      {c.status === "Bloqueado" ? t("card.unblock") : t("card.block")}
                    </button>
                    {c.type === "Virtual" && (
                      <button onClick={() => alert(t("actions.virtual_canceled")) } className="px-3 py-2 rounded bg-rose-900/40 text-rose-200">
                        {t("card.cancel_virtual")}
                      </button>
                    )}
                  </div>

                  {/* Detalhes protegidos */}
                  {showDetails[c.id] && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-slate-400 text-xs">{t("card.number")}</div>
                        <div className="flex items-center gap-2">
                          <span>{c.number}</span>
                          <button onClick={() => onCopy(c.number)} className="px-2 py-1 rounded bg-slate-800 text-xs">{t("card.copy")}</button>
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-xs">{t("card.expiry")}</div>
                        <div>{c.expiry}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-xs">{t("card.cvv")}</div>
                        <div className="flex items-center gap-2">
                          <span>***</span>
                          <button onClick={() => alert(`${t("card.cvv")}: ${c.cvv} (mock)`) } className="px-2 py-1 rounded bg-slate-800 text-xs">{t("card.show")}</button>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500">
                        {t("card.security_note")}
                      </div>
                    </div>
                  )}

                  {/* Saldo e limites */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    <div>{t("card.available_balance")}: <b>R$ {c.balance.toLocaleString("pt-BR")}</b></div>
                    <div>{t("card.daily_limit")}: <b>R$ {c.dailyLimit.toLocaleString("pt-BR")}</b></div>
                    <div>{t("card.status")}: <b>{statusLabel(c.status)}</b></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transações recentes */}
      <Card>
        <CardHeader>
          <CardTitle>{t("transactions.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-sm text-slate-500">{t("transactions.empty")}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {transactions.map((tItem, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-900 rounded px-3 py-2">
                  <div className="text-slate-300">{tItem.date} • R$ {tItem.value.toLocaleString("pt-BR")}</div>
                  <div className="text-xs text-slate-500">{tItem.merchant} • {tItem.status}{tItem.intl ? ` • ${t("transactions.intl")}` : ""}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configurações e Segurança */}
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => alert("OK") } className="px-3 py-2 rounded bg-slate-800 text-slate-200">{t("settings.instant_lock")}</button>
            <button onClick={() => alert("OK") } className="px-3 py-2 rounded bg-slate-800 text-slate-200">{t("settings.toggle_international")}</button>
            <button onClick={() => alert("OK") } className="px-3 py-2 rounded bg-slate-800 text-slate-200">{t("settings.notifications")}</button>
          </div>
          <div className="text-xs text-amber-300">
            {t("settings.tip")}
          </div>
          <div>
            <a href="/docs" className="underline text-slate-300">{t("settings.docs_link")}</a>
          </div>
        </CardContent>
      </Card>

      {/* Cartão físico: status de entrega */}
      <Card>
        <CardHeader>
          <CardTitle>{t("delivery.title")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div>{t("delivery.steps")}</div>
          <div className="text-xs text-slate-500">{t("delivery.tracking")}</div>
        </CardContent>
      </Card>

      {/* Ajuda & FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>{t("help.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 text-sm">
            <a href="/docs" className="px-3 py-2 rounded bg-slate-800">{t("help.how_to_use")}</a>
            <a href="/help" className="px-3 py-2 rounded bg-slate-800">{t("help.dispute")}</a>
            <a href="/help" className="px-3 py-2 rounded bg-slate-800">{t("help.quick_support")}</a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
