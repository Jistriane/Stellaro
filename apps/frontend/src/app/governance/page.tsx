"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getContractIds, viewGovernance } from "@/lib/soroban";
import { useTranslations } from "next-intl";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";
import { useEffect, useState } from "react";

export default function GovernancePage() {
  const t = useTranslations("governance");
  const tc = useTranslations("common");
  const [governance, setGovernance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Enable real-time updates when the wallet connects
  useRealTimeUpdates();
  
  useEffect(() => {
    async function loadData() {
      const governanceData = await viewGovernance();
      setGovernance(governanceData);
      setLoading(false);
    }
    
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center">
          <div className="text-slate-400">Loading...</div>
        </div>
      </div>
    );
  }

  const ids = getContractIds();

  // Open proposals (mock)
  const openProposals = [
    {
      id: "P-001",
      title: "Change STLT-BRL mint fee to 0.05%",
      status: "Open",
      endsAt: "2025-08-22",
      remaining: "2 days",
      badge: "new",
      votes: { yes: 65, no: 35 },
      author: governance?.admin || "GAY3LAQYJDER5XXZLM3XFCZNFEZAY26G3JXZV7GAXF7IDEQR3DKDK2TJ",
    },
    {
      id: "P-002",
      title: "Adjust Pix limit to R$ 50k",
      status: "Open",
      endsAt: "2025-08-25",
      remaining: "5 days",
      badge: "highlighted",
      votes: { yes: 52, no: 48 },
      author: governance?.admin || "GAY3LAQYJDER5XXZLM3XFCZNFEZAY26G3JXZV7GAXF7IDEQR3DKDK2TJ",
    },
  ];

  // Your vote (mock)
  const userVotes = {
    "P-001": "Yes", // already voted
  } as Record<string, "Yes" | "No" | undefined>;

  // Proposal history (mock)
  const pastProposals = [
    { id: "P-990", title: "Slippage limit in swap", status: "Approved", date: "2025-07-15", voters: 1023 },
    { id: "P-991", title: "Burn fee reduction", status: "Rejected", date: "2025-07-01", voters: 876 },
    { id: "P-992", title: "Partnership with Oracle Provider", status: "Closed", date: "2025-06-20", voters: 934 },
  ];

  const explorerUrl = ids.GOVERNANCE_CONTRACT_ID
    ? `https://stellar.expert/explorer/public/contract/${encodeURIComponent(ids.GOVERNANCE_CONTRACT_ID)}`
    : undefined;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("header.title")}</h1>
        <div className="text-xs text-slate-500">{t("header.updated_now")}</div>
      </div>

      {/* Summary/Admin */}
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
              <div className="truncate text-slate-200 max-w-[32ch]">{governance?.admin || "GAY3LAQYJDER5XXZLM3XFCZNFEZAY26G3JXZV7GAXF7IDEQR3DKDK2TJ"}</div>
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

      {/* Open proposals */}
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
                      <Progress value={p.votes.yes} className="mt-1" />
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

      {/* Proposal history */}
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

      {/* Education, rules and transparency */}
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

      {/* Alerts/Announcements */}
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
