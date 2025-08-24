import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getContractIds, viewLoansPool, getWalletBalances } from "@/lib/soroban";
import LoanSimulator from "./LoanSimulator";
import { getTranslations } from "next-intl/server";

export default async function LoansPage() {
  const t = await getTranslations("loans");
  const tc = await getTranslations("common");
  const ids = getContractIds();
  const [pool, wallet] = await Promise.all([
    viewLoansPool(),
    getWalletBalances(),
  ]);

  // Mocks de empréstimos ativos do usuário
  const activeLoans = [
    {
      id: "L-001",
      date: "2025-08-12",
      principal: 5000,
      currency: "BRL",
      collateralXLM: 300,
      balanceDue: 2890,
      interest_apr_bps: pool.interest_bps ?? 0, // usar pool como referência com fallback
      dueInDays: 12,
      status: "Em dia",
    },
    {
      id: "L-002",
      date: "2025-07-10",
      principal: 1000,
      currency: "USD",
      collateralXLM: 150,
      balanceDue: 450,
      interest_apr_bps: pool.interest_bps ?? 0,
      dueInDays: 2,
      status: "Próx. Ven.",
    },
  ];

  // Histórico (quitados/liquidados)
  const historyLoans = [
    { id: "H-101", start: "2025-06-01", amount: 800, paidAt: "2025-06-28", status: "Quitado" },
  ];

  const ltvPct = ((pool.ltv_bps ?? 0) / 100).toFixed(0); // exibição amigável
  const interestPct = ((pool.interest_bps ?? 0) / 100).toFixed(2);

  return (
    <div className="p-6 space-y-6">
      {/* Título e timestamp */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("header.title")}</h1>
        <div className="text-xs text-slate-500">{t("header.updated_now")}</div>
      </div>

      {/* Introdução e avisos */}
      <Card>
        <CardHeader>
          <CardTitle>{t("intro.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-300">{t("intro.p1")}</p>
          <div className="mt-3 rounded border border-amber-300 bg-amber-50/10 p-3 text-amber-300 text-xs">
            {t("intro.responsibility")}
          </div>
        </CardContent>
      </Card>

      {/* Resumo do Pool / Parâmetros */}
      <Card>
        <CardHeader>
          <CardTitle>{t("pool.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-slate-400">{t("pool.contract")}</div>
          <div className="truncate mb-2 text-slate-200">{ids.LOANSPOOL_CONTRACT_ID || "—"}</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>{t("pool.ltv_max")}: <b>{ltvPct}%</b></div>
            <div>{t("pool.apr")}: <b>{interestPct}%</b></div>
            <div>{t("pool.accounts")}: <b>{pool.accounts}</b></div>
            <div>{t("pool.total_deposits")}: <b>{pool.total_deposits}</b></div>
            <div>{t("pool.total_borrowed")}: <b>{pool.total_borrowed}</b></div>
          </div>
        </CardContent>
      </Card>

      {/* Empréstimos Ativos */}
      <Card>
        <CardHeader>
          <CardTitle>{t("active.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {activeLoans.length === 0 ? (
            <div className="text-sm text-slate-400">{t("active.none")}</div>
          ) : (
            <div className="space-y-3">
              {activeLoans.map((l) => (
                <div key={l.id} className="rounded bg-slate-900 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm">
                      <div className="text-slate-300">{l.date} • <b>{l.id}</b></div>
                      <div className="text-slate-400 text-xs">{t("active.effective_rate", { apr: (l.interest_apr_bps/100).toFixed(2) })}</div>
                    </div>
                    <div className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300">{l.status}</div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-6 gap-3 text-sm">
                    <div>
                      <div className="text-slate-400 text-xs">{t("active.value")}</div>
                      <div className="text-slate-200">{l.currency === "USD" ? "$" : "R$"} {l.principal.toLocaleString("pt-BR")}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-xs">{t("active.collateral")}</div>
                      <div className="text-slate-200">{l.collateralXLM} XLM</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-xs">{t("active.balance_due")}</div>
                      <div className="text-slate-200">{l.currency === "USD" ? "$" : "R$"} {l.balanceDue.toLocaleString("pt-BR")}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-xs">{t("active.due_in")}</div>
                      <div className="text-slate-200">{t("active.days", { days: l.dueInDays })}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-xs">{t("active.risk")}</div>
                      <div className="text-amber-400">{t("active.monitor_collateral")}</div>
                    </div>
                    <div className="flex items-end">
                      <div className="flex gap-2">
                        <button disabled className="px-3 py-2 rounded bg-slate-800 text-slate-400 text-xs cursor-not-allowed" title={tc("soon")}>{t("active.pay")}</button>
                        <button disabled className="px-3 py-2 rounded bg-slate-800 text-slate-400 text-xs cursor-not-allowed" title={tc("soon")}>{t("active.add_collateral")}</button>
                        <Link href={`/loans/${l.id}`} className="px-3 py-2 rounded bg-slate-800 text-slate-200 text-xs">{t("active.details")}</Link>
                      </div>
                    </div>
                  </div>
                  {/* Detalhes resumidos */}
                  <div className="mt-2 text-xs text-slate-500">{t("active.summary_mock")}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Empréstimos */}
      <Card>
        <CardHeader>
          <CardTitle>{t("history.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoans.length === 0 ? (
            <div className="text-sm text-slate-400">{t("history.none")}</div>
          ) : (
            <div className="space-y-2">
              {historyLoans.map((h) => (
                <div key={h.id} className="flex items-center justify-between bg-slate-900 rounded px-3 py-2 text-sm">
                  <div className="text-slate-300">{h.start} • {h.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
                  <div className="text-slate-400 text-xs">{t("history.paid_at", { date: h.paidAt, status: h.status })}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Simulador de Empréstimo (interativo) */}
      <Card>
        <CardHeader>
          <CardTitle>{t("simulator.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-slate-400 mb-2">{t("simulator.subtitle")}</div>
          <LoanSimulator ltvBps={pool.ltv_bps ?? 0} interestAprBps={pool.interest_bps ?? 0} wallet={{ xlm: wallet.xlm ?? 0, stlt: wallet.stlt }} />
          <div className="text-xs text-slate-500 mt-3">{t("simulator.balance", { xlm: wallet.xlm, stlt: Number(wallet.stlt || 0).toLocaleString("pt-BR") })}</div>
        </CardContent>
      </Card>

      {/* Condições e Requisitos */}
      <Card>
        <CardHeader>
          <CardTitle>{t("conditions.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-slate-400">{t("conditions.fees")}</div>
              <div>{t("conditions.apr_line", { apr: interestPct })}</div>
            </div>
            <div>
              <div className="text-slate-400">{t("conditions.limits")}</div>
              <div>{t("conditions.range")}</div>
            </div>
            <div>
              <div className="text-slate-400">{t("conditions.collateral")}</div>
              <div>{t("conditions.ltv_assets", { ltv: ltvPct })}</div>
            </div>
          </div>
          <ul className="mt-3 list-disc pl-5 text-xs text-slate-400 space-y-1">
            <li>{t("conditions.note_iof")}</li>
            <li>{t("conditions.note_late")}</li>
            <li>{t("conditions.note_liquidation")}</li>
          </ul>
        </CardContent>
      </Card>

      {/* Passo-a-passo de contratação */}
      <Card>
        <CardHeader>
          <CardTitle>{t("steps.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-300">
            <li>{t("steps.s1")}</li>
            <li>{t("steps.s2")}</li>
            <li>{t("steps.s3")}</li>
            <li>{t("steps.s4")}</li>
          </ol>
          <div className="mt-3 flex gap-2">
            <button className="px-4 py-2 rounded bg-emerald-600 text-white text-sm" title="Mock">{t("steps.apply")}</button>
            <button className="px-4 py-2 rounded bg-slate-800 text-slate-200 text-sm" title="Mock">{t("steps.track")}</button>
          </div>
        </CardContent>
      </Card>

      {/* Gestão de Garantias e Limite */}
      <Card>
        <CardHeader>
          <CardTitle>{t("collateral.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-slate-400">{t("collateral.limit_available")}</div>
              <div className="text-slate-200">R$ 12.000</div>
            </div>
            <div>
              <div className="text-slate-400">{t("collateral.deposited")}</div>
              <div className="text-slate-200">450 XLM • 2.000 STLT</div>
            </div>
            <div>
              <div className="text-slate-400">{t("collateral.avg_ltv")}</div>
              <div className="text-amber-300">{t("collateral.risk_attention")}</div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <button className="px-3 py-2 rounded bg-slate-800 text-slate-200">{t("collateral.add")}</button>
            <button className="px-3 py-2 rounded bg-slate-800 text-slate-200">{t("collateral.remove")}</button>
            <button className="px-3 py-2 rounded bg-slate-800 text-slate-200">{t("collateral.renegotiate")}</button>
          </div>
          <div className="mt-2 text-xs text-slate-500">{t("collateral.note_ltv")}</div>
        </CardContent>
      </Card>

      {/* Alertas e Recomendações */}
      <Card>
        <CardHeader>
          <CardTitle>{t("alerts.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 text-sm space-y-1 text-amber-300">
            <li>{t("alerts.item1")}</li>
            <li>{t("alerts.item2")}</li>
          </ul>
        </CardContent>
      </Card>

      {/* Ajuda e FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>{t("faq.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-300">{t("faq.text")}</p>
          <div className="mt-3 flex gap-2 text-sm">
            <Link href="/docs" className="px-3 py-2 rounded bg-slate-800">{t("faq.view_faq")}</Link>
            <Link href="/help" className="px-3 py-2 rounded bg-slate-800">{t("faq.need_help")}</Link>
          </div>
          <div className="text-xs text-slate-500 mt-2">{t("faq.security_note")}</div>
        </CardContent>
      </Card>

      {/* Informações Legais e Contratuais */}
      <Card>
        <CardHeader>
          <CardTitle>{t("legal.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/docs" className="px-3 py-2 rounded bg-slate-800">{t("legal.loan_contract")}</Link>
            <Link href="/docs" className="px-3 py-2 rounded bg-slate-800">{t("legal.loan_terms")}</Link>
            <Link href="/help" className="px-3 py-2 rounded bg-slate-800">{t("legal.loan_faq")}</Link>
          </div>
          <div className="text-xs text-slate-500 mt-2">{t("legal.read_first")}</div>
        </CardContent>
      </Card>

      {/* Conteúdo Educativo e Alertas */}
      <Card>
        <CardHeader>
          <CardTitle>{t("education.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 text-sm space-y-1 text-slate-300">
            <li>{t("education.item1")}</li>
            <li>{t("education.item2")}</li>
            <li>{t("education.item3")}</li>
          </ul>
        </CardContent>
      </Card>

      {/* Ações rápidas */}
      <div className="flex flex-wrap gap-2">
        <button className="px-4 py-2 rounded bg-emerald-600 text-white text-sm">{t("quick.apply")}</button>
        <button className="px-4 py-2 rounded bg-slate-800 text-slate-200 text-sm">{t("quick.simulate")}</button>
        <button className="px-4 py-2 rounded bg-slate-800 text-slate-200 text-sm">{t("quick.track")}</button>
        <button className="px-4 py-2 rounded bg-slate-800 text-slate-200 text-sm">{t("quick.prepay")}</button>
        <button className="px-4 py-2 rounded bg-slate-800 text-slate-200 text-sm">{t("quick.support")}</button>
      </div>
    </div>
  );
}
