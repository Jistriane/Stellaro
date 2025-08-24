'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';

type RiskLevel = 'low' | 'medium' | 'high';

interface AlertItem {
  id: string;
  type: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  time: string; // ISO ou legível
}

interface RecentEvent {
  id: string;
  label: string;
  time: string;
  severity: 'low' | 'medium' | 'high';
}

interface LimitsState {
  pixDaily: number;
  withdrawDaily: number;
  tradeDaily: number;
}

export default function RiskPage() {
  const t = useTranslations('risk');
  
  // Ativa atualizações em tempo real quando carteira conecta
  useRealTimeUpdates();
  // Mock: score e nível
  const [score, setScore] = useState<number>(62); // 0-100
  const level: RiskLevel = useMemo(() => {
    if (score >= 80) return 'low';
    if (score >= 50) return 'medium';
    return 'high';
  }, [score]);

  // Mock: alertas ativos
  const [alerts, setAlerts] = useState<AlertItem[]>([
    {
      id: 'a1',
      type: 'warning',
      title: 'Transação incomum detectada',
      description: 'Um Pix acima do seu padrão foi sinalizado para análise.',
      time: '2025-08-23 10:20',
    },
    {
      id: 'a2',
      type: 'info',
      title: 'Limite de segurança ativo',
      description: 'Você definiu limite diário para Pix e Saques.',
      time: '2025-08-22 18:41',
    },
  ]);

  // Mock: eventos recentes
  const [events] = useState<RecentEvent[]>([
    { id: 'e1', label: 'Login em novo dispositivo', time: '2025-08-22 22:10', severity: 'medium' },
    { id: 'e2', label: 'Pix acima do limite usual', time: '2025-08-22 21:35', severity: 'high' },
    { id: 'e3', label: 'Senha redefinida', time: '2025-08-21 09:05', severity: 'low' },
  ]);

  // Mock: limites e travas
  const [limits, setLimits] = useState<LimitsState>({ pixDaily: 5000, withdrawDaily: 2500, tradeDaily: 20000 });
  const [editing, setEditing] = useState(false);

  // Mock: riscos de mercado
  const [marketRisk] = useState({ token: 'STLT', volatility: 'Alta', note: 'Volatilidade incomum nas últimas 24h.' });

  // Mock: compliance e auditoria
  const [compliance] = useState({ audited: true, lastAudit: '12/08/2025', reportUrl: '/docs' });

  // Feedback simples (mock toast inline)
  const [feedback, setFeedback] = useState<string>('');
  const notify = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 3000);
  };

  const levelColor = (lvl: RiskLevel) =>
    ({ low: 'bg-emerald-100 text-emerald-700', medium: 'bg-amber-100 text-amber-700', high: 'bg-rose-100 text-rose-700' }[lvl]);

  const alertColor = (type: AlertItem['type']) =>
    ({ info: 'border-sky-200 bg-sky-50', warning: 'border-amber-200 bg-amber-50', critical: 'border-rose-200 bg-rose-50' }[type]);

  function handleImproveSecurity() {
    setScore((s) => Math.min(100, s + 5));
    notify(t('sidebar.improve_feedback'));
  }

  function handleReport(id?: string) {
    notify(id ? t('alerts.reported_alert') : t('alerts.reported_activity'));
  }

  function handleBlockAccount() {
    const ok = window.confirm(t('quick.confirm_block'));
    if (ok) notify(t('quick.blocked_feedback'));
  }

  function toggleEditing() {
    setEditing((v) => !v);
  }

  function saveLimits() {
    setEditing(false);
    notify('Limites atualizados com sucesso.');
  }

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      {/* Introdução */}
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-semibold">{t('header.title')}</h1>
        <p className="mt-2 text-gray-600">{t('header.intro')}</p>
      </section>

      {/* Feedback simples */}
      {feedback && (
        <div role="status" className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-emerald-700">
          {feedback}
        </div>
      )}

      {/* Alertas ativos e status */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 space-y-3">
          {alerts.length === 0 ? (
            <div className="rounded-md border border-sky-200 bg-sky-50 p-4 text-sky-700">{t('alerts.none')}</div>
          ) : (
            alerts.map((a) => (
              <div key={a.id} className={`rounded-md border p-4 ${alertColor(a.type)}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{a.title}</p>
                    <p className="text-sm text-gray-700">{a.description}</p>
                    <p className="mt-1 text-xs text-gray-500">{a.time}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => handleReport(a.id)}
                      className="rounded border px-3 py-1 text-sm hover:bg-white/60"
                      aria-label={t('alerts.report_alert_aria')}
                    >
                      {t('alerts.report')}
                    </button>
                    <button
                      onClick={() => setAlerts((prev) => prev.filter((x) => x.id !== a.id))}
                      className="rounded border px-3 py-1 text-sm hover:bg-white/60"
                      aria-label={t('alerts.dismiss_alert_aria')}
                    >
                      {t('alerts.dismiss')}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-600">{t('sidebar.score_label')}</p>
          <div className={`mt-2 inline-block rounded px-2 py-1 text-sm font-medium ${levelColor(level)}`}>
            {level === 'low' ? t('sidebar.level_low') : level === 'medium' ? t('sidebar.level_medium') : t('sidebar.level_high')}
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{t('sidebar.score')}</span>
              <span>{score}%</span>
            </div>
            <div className="mt-1 h-2 w-full rounded bg-gray-200">
              <div
                className={`h-2 rounded ${level === 'low' ? 'bg-emerald-500' : level === 'medium' ? 'bg-amber-500' : 'bg-rose-500'}`}
                style={{ width: `${score}%` }}
              />
            </div>
            <button onClick={handleImproveSecurity} className="mt-3 w-full rounded bg-indigo-600 px-3 py-2 text-white">
              {t('sidebar.improve_btn')}
            </button>
          </div>
        </div>
      </section>

      {/* Comportamentos recentes */}
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('events.title')}</h2>
          <button onClick={() => notify(t('events.open_center_feedback'))} className="text-sm text-indigo-600 underline">
            {t('events.view_all')}
          </button>
        </div>
        <ul className="mt-3 divide-y">
          {events.map((ev) => (
            <li key={ev.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">{ev.label}</p>
                <p className="text-xs text-gray-500">{ev.time}</p>
              </div>
              <span
                className={`rounded px-2 py-1 text-xs ${
                  ev.severity === 'low'
                    ? 'bg-emerald-100 text-emerald-700'
                    : ev.severity === 'medium'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                {ev.severity === 'low' ? t('events.severity_low') : ev.severity === 'medium' ? t('events.severity_medium') : t('events.severity_high')}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex gap-2">
          <button onClick={() => handleReport()} className="rounded border px-3 py-2 text-sm hover:bg-gray-50">
            {t('events.report_activity')}
          </button>
          <button onClick={handleBlockAccount} className="rounded bg-rose-600 px-3 py-2 text-sm text-white">
            {t('events.block_now')}
          </button>
        </div>
      </section>

      {/* Limites e travas */}
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">{t('limits.title')}</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-sm text-gray-600">{t('limits.pix_daily')}</label>
            <input
              type="number"
              value={limits.pixDaily}
              onChange={(e) => setLimits((s) => ({ ...s, pixDaily: Number(e.target.value) }))}
              disabled={!editing}
              className="mt-1 w-full rounded border p-2 disabled:bg-gray-50"
              aria-label={t('limits.aria_pix_daily')}
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">{t('limits.withdraw_daily')}</label>
            <input
              type="number"
              value={limits.withdrawDaily}
              onChange={(e) => setLimits((s) => ({ ...s, withdrawDaily: Number(e.target.value) }))}
              disabled={!editing}
              className="mt-1 w-full rounded border p-2 disabled:bg-gray-50"
              aria-label={t('limits.aria_withdraw_daily')}
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">{t('limits.trade_daily')}</label>
            <input
              type="number"
              value={limits.tradeDaily}
              onChange={(e) => setLimits((s) => ({ ...s, tradeDaily: Number(e.target.value) }))}
              disabled={!editing}
              className="mt-1 w-full rounded border p-2 disabled:bg-gray-50"
              aria-label={t('limits.aria_trade_daily')}
            />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          {!editing ? (
            <button onClick={toggleEditing} className="rounded bg-indigo-600 px-3 py-2 text-white">
              {t('limits.review_limits')}
            </button>
          ) : (
            <>
              <button onClick={saveLimits} className="rounded bg-emerald-600 px-3 py-2 text-white">
                {t('limits.save')}
              </button>
              <button onClick={toggleEditing} className="rounded border px-3 py-2">
                {t('limits.cancel')}
              </button>
            </>
          )}
        </div>
      </section>

      {/* Monitoramento de fraudes e golpes */}
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">{t('fraud.title')}</h2>
        <div className="mt-2 space-y-2">
          <div className="rounded border border-amber-200 bg-amber-50 p-3 text-amber-800">{t('fraud.warning')}</div>
          <div className="text-sm text-indigo-700 underline">
            <a href="/help" aria-label={t('fraud.tips_aria')}>{t('fraud.tips')}</a>
          </div>
        </div>
      </section>

      {/* Riscos de mercado */}
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">{t('market.title')}</h2>
        <p className="mt-2 text-gray-700">{t('market.alert', { token: marketRisk.token, volatility: marketRisk.volatility })}</p>
        <p className="text-sm text-gray-500">{marketRisk.note}</p>
        <div className="mt-3 text-sm text-indigo-700 underline">
          <a href="/docs">{t('market.link')}</a>
        </div>
      </section>

      {/* Transparência e Compliance */}
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">{t('compliance.title')}</h2>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-1 text-emerald-700">
            ✅ {t('compliance.badge')}
          </span>
          <span className="text-gray-600">{t('compliance.last_review')}: {compliance.lastAudit}</span>
          <a href={compliance.reportUrl} className="text-indigo-700 underline">
            {t('compliance.view_report')}
          </a>
        </div>
      </section>

      {/* Conteúdo educativo */}
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">{t('edu.title')}</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div className="rounded border p-3">
            <p className="font-medium">{t('edu.q1')}</p>
            <p className="mt-1 text-sm text-gray-600">{t('edu.q1_desc')}</p>
          </div>
          <div className="rounded border p-3">
            <p className="font-medium">{t('edu.q2')}</p>
            <p className="mt-1 text-sm text-gray-600">{t('edu.q2_desc')}</p>
          </div>
          <div className="rounded border p-3">
            <p className="font-medium">{t('edu.q3')}</p>
            <p className="mt-1 text-sm text-gray-600">{t('edu.q3_desc')}</p>
          </div>
        </div>
      </section>

      {/* Canal rápido de ação */}
      <section className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">{t('quick.title')}</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <button onClick={() => notify(t('quick.escalated_feedback'))} className="rounded bg-indigo-600 px-4 py-2 text-white">
            {t('quick.contact_team')}
          </button>
          <button onClick={() => notify(t('quick.open_chat_feedback'))} className="rounded border px-4 py-2">
            {t('quick.view_faq')}
          </button>
          <button onClick={handleBlockAccount} className="rounded bg-rose-600 px-4 py-2 text-white">
            {t('quick.block_now')}
          </button>
        </div>
      </section>

      {/* Aviso de segurança */}
      <p className="text-xs text-gray-500">{t('footer.warning')}</p>
    </div>
  );
}
