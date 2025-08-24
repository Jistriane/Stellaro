import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getContractIds, viewGovernance } from "@/lib/soroban";
import { getTranslations } from "next-intl/server";

export default async function GovernancePage() {
  const t = await getTranslations("governance");
  const tc = await getTranslations("common");
  const ids = getContractIds();
  const g = await viewGovernance();

  // Propostas abertas (mock)
  const openProposals = [
    {
      id: "P-001",
      title: "Alteração da taxa de mint STLT-BRL para 0,05%",
      status: "Aberta",
      endsAt: "2025-08-22",
      remaining: "2 dias",
      badge: "nova",
      votes: { yes: 65, no: 35 },
      author: g.admin,
    },
    {
      id: "P-002",
      title: "Ajuste no limite de Pix para R$ 50k",
      status: "Aberta",
      endsAt: "2025-08-25",
      remaining: "5 dias",
      badge: "em destaque",
      votes: { yes: 52, no: 48 },
      author: g.admin,
    },
  ];

  // Seu voto (mock)
  const userVotes = {
    "P-001": "Sim", // já votou
  } as Record<string, "Sim" | "Não" | undefined>;

  // Histórico de propostas (mock)
  const pastProposals = [
    { id: "P-990", title: "Limite de slippage no swap", status: "Aprovada", date: "2025-07-15", voters: 1023 },
    { id: "P-991", title: "Redução de taxa de burn", status: "Rejeitada", date: "2025-07-01", voters: 876 },
    { id: "P-992", title: "Parceria com Provedor de Oracle", status: "Encerrada", date: "2025-06-20", voters: 934 },
  ];

  const explorerUrl = ids.GOVERNANCE_CONTRACT_ID
    ? `https://stellar.expert/explorer/public/contract/${encodeURIComponent(ids.GOVERNANCE_CONTRACT_ID)}`
    : undefined;

  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("header.title")}</h1>
        <div className="text-xs text-slate-500">{t("header.updated_now")}</div>
      </div>

      {/* Resumo/Admin */}
      <Card>
        <CardHeader>
          <CardTitle>{t("summary.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <div className="text-xs text-slate-500">{t("summary.contract")}</div>
              <div className="truncate text-slate-200">{ids.GOVERNANCE_CONTRACT_ID || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">{t("summary.current_admin")}</div>
              <div className="truncate text-slate-200 max-w-[32ch]">{g.admin}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">{t("summary.open_proposals")}</div>
              <div className="text-slate-200">{openProposals.length}</div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            {explorerUrl ? (
              <a href={explorerUrl} target="_blank" rel="noreferrer" className="px-3 py-2 rounded bg-slate-800">{t("summary.view_explorer")}</a>
            ) : null}
            <Link href="/docs" className="px-3 py-2 rounded bg-slate-800">{t("summary.docs")}</Link>
          </div>
        </CardContent>
      </Card>

      {/* Propostas Abertas */}
      <Card>
        <CardHeader>
          <CardTitle>{t("open.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {openProposals.length === 0 ? (
            <div className="text-sm text-slate-400">{t("open.empty")}</div>
          ) : (
            <div className="space-y-3">
              {openProposals.map((p) => (
                <div key={p.id} className="rounded bg-slate-900 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-slate-200 text-sm">{p.title}</div>
                      <div className="text-xs text-slate-500">{t("open.author", { author: p.author ?? "" })}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300">{p.status}</span>
                      <span className="text-[10px] px-2 py-1 rounded bg-emerald-900/40 text-emerald-300 uppercase">{p.badge}</span>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-slate-500">{t("open.end")}</div>
                      <div className="text-slate-200">{p.endsAt}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">{t("open.remaining")}</div>
                      <div className="text-slate-200">{p.remaining}</div>
                    </div>
                    <div className="sm:col-span-2">
                      <div className="text-xs text-slate-500">{t("open.partial_results")}</div>
                      <div className="w-full bg-slate-800 rounded h-2 overflow-hidden">
                        <div className="bg-emerald-500 h-2" style={{ width: `${p.votes.yes}%` }} />
                      </div>
                      <div className="text-xs text-slate-400 mt-1">{t("open.yes_no", { yes: p.votes.yes, no: p.votes.no })}</div>
                    </div>
                    <div className="flex items-end">
                      {userVotes[p.id] ? (
                        <span className="text-xs text-slate-400">{t("open.you_voted", { vote: userVotes[p.id] ?? "" })}</span>
                      ) : (
                        <button disabled className="px-3 py-2 rounded bg-slate-800 text-slate-400 text-xs cursor-not-allowed" title={tc("soon")}>{t("open.vote_now")}</button>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2 text-xs">
                    <Link href={`/governance/${p.id}`} className="px-2 py-1 rounded bg-slate-800">{t("open.details")}</Link>
                    <Link href={`/governance/${p.id}#discussion`} className="px-2 py-1 rounded bg-slate-800">{t("open.discussion")}</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Propostas */}
      <Card>
        <CardHeader>
          <CardTitle>{t("history.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {pastProposals.length === 0 ? (
            <div className="text-sm text-slate-400">{t("history.empty")}</div>
          ) : (
            <div className="space-y-2">
              {pastProposals.map((h) => (
                <div key={h.id} className="flex items-center justify-between bg-slate-900 rounded px-3 py-2 text-sm">
                  <div className="text-slate-300">{h.date} • {h.title}</div>
                  <div className="text-xs text-slate-400">{t("history.status_voters", { status: h.status, voters: h.voters })}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Educação, Regras e Transparência */}
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
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <Link href="/docs" className="px-3 py-2 rounded bg-slate-800">{t("education.learn_more")}</Link>
            {explorerUrl ? (
              <a href={explorerUrl} target="_blank" rel="noreferrer" className="px-3 py-2 rounded bg-slate-800">{t("education.view_contracts")}</a>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Alertas/Comunicados */}
      <Card>
        <CardHeader>
          <CardTitle>{t("notices.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 text-sm space-y-1 text-amber-300">
            <li>{t("notices.item1")}</li>
            <li>{t("notices.item2")}</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
