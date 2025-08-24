"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import InsuranceSimulator from "./InsuranceSimulator";
import { useTranslations } from "next-intl";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";

export default function InsurancePage() {
  const t = useTranslations("insurance");
  
  // Ativa atualizações em tempo real quando carteira conecta
  useRealTimeUpdates();
  const offers = [
    { key: 'saldo' },
    { key: 'cartao' },
    { key: 'cyber' },
    { key: 'defi' },
  ];

  const myPolicies = [
    { id: 'P-001', name: 'Saldo/Token', status: 'Ativo', until: '10/08/2026', premium: 'R$ 6,99/mês' },
    { id: 'P-002', name: 'Cartão', status: 'Aguardando pagamento', until: '—', premium: 'R$ 4,99/mês' },
  ];

  const claims = [
    { id: 'S-1001', policy: 'Saldo/Token', status: 'Em análise', openedAt: '12/08/2025' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('header.title')}</h1>
        <div className="text-xs text-slate-500">{t('header.updated_now')}</div>
      </div>

      {/* Introdução */}
      <Card>
        <CardHeader>
          <CardTitle>{t('intro.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-300">{t('intro.p1')}</p>
          <div className="mt-3 rounded border border-amber-300 bg-amber-50/10 p-3 text-amber-300 text-xs">
            {t('intro.warning')}
          </div>
        </CardContent>
      </Card>

      {/* Ofertas e Tipos */}
      <Card>
        <CardHeader>
          <CardTitle>{t('offers.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {offers.map((o) => (
              <div key={o.key} className="rounded border border-slate-800 bg-slate-900/50 p-3">
                <div className="font-medium text-slate-100">{t(`offers.items.${o.key}.title`)}</div>
                <div className="text-xs text-slate-400">{t(`offers.items.${o.key}.desc`)}</div>
                <div className="mt-2 text-sm text-emerald-300">{t(`offers.items.${o.key}.price`)}</div>
                <button className="mt-2 w-full rounded bg-slate-800 text-slate-100 text-sm py-2">{t('offers.simulate')}</button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Simulador Rápido */}
      <Card>
        <CardHeader>
          <CardTitle>{t('quick_sim.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400 mb-2">{t('quick_sim.subtitle')}</p>
          <InsuranceSimulator />
        </CardContent>
      </Card>

      {/* Detalhamento Transparente */}
      <Card>
        <CardHeader>
          <CardTitle>{t('coverage.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="rounded border border-emerald-300/30 bg-emerald-900/10 p-3">
              <div className="font-medium text-emerald-300">{t('coverage.covers')}</div>
              <ul className="list-disc pl-5 text-slate-300 space-y-1 mt-1">
                {t.raw('coverage.covers_items').map((item: string, idx: number) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded border border-rose-300/30 bg-rose-900/10 p-3">
              <div className="font-medium text-rose-300">{t('coverage.doesnt_cover')}</div>
              <ul className="list-disc pl-5 text-slate-300 space-y-1 mt-1">
                {t.raw('coverage.doesnt_cover_items').map((item: string, idx: number) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm mt-4">
            <div>
              <div className="text-slate-400">{t('details.limit')}</div>
              <div className="text-slate-200">{t('details.limit_value')}</div>
            </div>
            <div>
              <div className="text-slate-400">{t('details.waiting')}</div>
              <div className="text-slate-200">{t('details.waiting_value')}</div>
            </div>
            <div>
              <div className="text-slate-400">{t('details.deductible')}</div>
              <div className="text-slate-200">{t('details.deductible_value')}</div>
            </div>
            <div>
              <div className="text-slate-400">{t('details.payment')}</div>
              <div className="text-slate-200">{t('details.payment_value')}</div>
            </div>
          </div>
          <div className="mt-3 text-sm">
            <Link href="/docs" className="underline text-indigo-300">{t('details.docs_link')}</Link>
          </div>
        </CardContent>
      </Card>

      {/* Processo de Contratação */}
      <Card>
        <CardHeader>
          <CardTitle>{t('howto.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-300">
            {t.raw('howto.steps').map((s: string, i: number) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
          <div className="mt-3 flex gap-2">
            <button className="px-4 py-2 rounded bg-emerald-600 text-white text-sm">{t('howto.hire')}</button>
            <button className="px-4 py-2 rounded bg-slate-800 text-slate-200 text-sm">{t('howto.view_terms')}</button>
          </div>
        </CardContent>
      </Card>

      {/* Meus Seguros */}
      <Card>
        <CardHeader>
          <CardTitle>{t('mine.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {myPolicies.map((p) => (
              <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-900 rounded px-3 py-2">
                <div className="text-slate-200">{p.name} • {p.status}</div>
                <div className="text-slate-400">{t('mine.validity')}: {p.until} • {t('mine.premium')}: {p.premium}</div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 rounded bg-slate-800">{t('mine.policy_view')}</button>
                  <button className="px-3 py-1 rounded bg-slate-800">{t('mine.policy_change')}</button>
                  <button className="px-3 py-1 rounded bg-rose-700 text-white">{t('mine.policy_cancel')}</button>
                  <button className="px-3 py-1 rounded bg-amber-600 text-white">{t('mine.policy_claim')}</button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sinistros */}
      <Card>
        <CardHeader>
          <CardTitle>{t('claims.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {claims.length === 0 ? (
            <div className="text-sm text-slate-400">{t('claims.none')}</div>
          ) : (
            <div className="space-y-2 text-sm">
              {claims.map((c) => (
                <div key={c.id} className="flex items-center justify-between bg-slate-900 rounded px-3 py-2">
                  <div className="text-slate-200">{c.id} • {c.policy}</div>
                  <div className="text-slate-400 text-xs">{c.openedAt} • {c.status}</div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 rounded bg-slate-800">{t('claims.send_docs')}</button>
                    <button className="px-3 py-1 rounded bg-slate-800">{t('claims.track')}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* FAQ, Educativo e Alertas */}
      <Card>
        <CardHeader>
          <CardTitle>{t('faq_edu.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="font-medium text-slate-100 mb-1">{t('faq_edu.faq_title')}</div>
              <ul className="list-disc pl-5 text-sm text-slate-300 space-y-1">
                {t.raw('faq_edu.faq_items').map((q: string, i: number) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="font-medium text-slate-100 mb-1">{t('faq_edu.edu_title')}</div>
              <ul className="list-disc pl-5 text-sm text-slate-300 space-y-1">
                {t.raw('faq_edu.edu_items').map((q: string, i: number) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-3 rounded border border-amber-300 bg-amber-50/10 p-3 text-amber-300 text-xs">
            {t('faq_edu.alert')}
          </div>
        </CardContent>
      </Card>

      {/* Documentos Legais e Suporte */}
      <Card>
        <CardHeader>
          <CardTitle>{t('docs_support.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 text-sm">
            <Link href="/docs" className="px-3 py-2 rounded bg-slate-800">{t('docs_support.full_terms')}</Link>
            <Link href="/docs" className="px-3 py-2 rounded bg-slate-800">{t('docs_support.tech_notes')}</Link>
            <Link href="/docs" className="px-3 py-2 rounded bg-slate-800">{t('docs_support.insurer')}</Link>
          </div>
          <div className="mt-3 text-sm">
            <div>{t('docs_support.support_title')}</div>
            <div className="text-xs text-slate-500">{t('docs_support.support_hours')}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
