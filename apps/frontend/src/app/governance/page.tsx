"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getContractIds, viewGovernance, createProposal, queueProposal, executeProposal } from "@/lib/soroban";
import { useTranslations } from "next-intl";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { ShieldCheck, ShieldAlert, BrainCircuit } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function GovernancePage() {
  const t = useTranslations("governance");
  const tc = useTranslations("common");
  const [governance, setGovernance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCompliant, setIsCompliant] = useState<boolean | null>(null);

  // Enable real-time updates when the wallet connects
  useRealTimeUpdates();
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: "", action: "update_params", target: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [isAiDrafting, setIsAiDrafting] = useState(false);

  useEffect(() => {
    async function loadData() {
      const governanceData = await viewGovernance();
      setGovernance(governanceData);
      
      // Simulate KYC verification for the logged-in user (using the admin as a proxy for the demo)
      const compliant = governanceData?.admin ? true : false;
      setIsCompliant(compliant);
      
      setLoading(false);
    }
    
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createProposal(formData.title, formData.action, formData.target, formData.description);
      alert("Proposal sent successfully!");
      setShowForm(false);
    } catch (e) {
      alert("Error while sending the proposal");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAiDraft = async () => {
    setIsAiDrafting(true);
    // Simulate an ElizaOS call to generate a smart proposal
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setFormData({
      title: "Collateralization Fee Optimization (LTV)",
      action: "update_ltv_params",
      target: ids.LOANSPOOL_CONTRACT_ID || "C...",
      description: "Based on the volatility analysis from the last quarter, the AI recommends increasing the LTV for the STLT-BRL pair from 85% to 90% for users with ZK Score > 800."
    });
    
    setIsAiDrafting(false);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
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

  const handleQueue = async (id: string) => {
    try {
      await queueProposal(id);
      alert("Proposal sent to the execution queue (24h timelock)");
    } catch (e) {
      alert("Error while queueing the proposal");
    }
  };

  const handleExecute = async (id: string) => {
    try {
      await executeProposal(id);
      alert("Proposal executed successfully!");
    } catch (e) {
      alert("Error while executing the proposal");
    }
  };

  const explorerUrl = ids.GOVERNANCE_CONTRACT_ID
    ? `https://stellar.expert/explorer/public/contract/${encodeURIComponent(ids.GOVERNANCE_CONTRACT_ID)}`
    : undefined;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <Image src="/capa.png" alt="Stellaro background" fill priority sizes="100vw" className="object-cover object-center opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/85 to-background/60" />
      <div className="absolute inset-0 bg-[radial-gradient(1000px_circle_at_20%_15%,rgba(var(--stellaro-accent-rgb),0.14),transparent_60%),radial-gradient(900px_circle_at_80%_10%,rgba(197,135,230,0.10),transparent_55%)]" />
      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">{t("header.title")}</h1>
            <Badge variant="outline" className="border-primary/25 bg-primary/10 text-primary">
              V5 Protocol
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">Democratic decisions governed via on-chain timelocks.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Compliance Status Indicator */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors ${
            isCompliant 
              ? 'bg-primary/10 border-primary/25 text-primary' 
              : 'bg-destructive/10 border-destructive/25 text-destructive'
          }`}>
            {isCompliant ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
            <span className="text-xs font-medium">{isCompliant ? "SSI Compliant" : "KYC Required"}</span>
          </div>

          <Button 
            variant="default" 
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/10"
            onClick={() => setShowForm(!showForm)}
            disabled={!isCompliant}
          >
            {showForm ? "Cancel" : "New Proposal"}
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="border-border/60 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Create New Proposal</CardTitle>
            <Button 
              size="sm" 
              variant="outline" 
              className="border-primary/25 text-primary hover:bg-primary/10 flex items-center gap-2 group"
              onClick={handleAiDraft}
              disabled={isAiDrafting}
            >
              <BrainCircuit className={`w-4 h-4 ${isAiDrafting ? 'animate-pulse' : 'group-hover:rotate-12 transition-transform'}`} />
              {isAiDrafting ? "Analyzing Governance..." : "Draft with ElizaOS ✨"}
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Title</label>
                  <Input 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g. Reduce mint fee"
                    className="bg-secondary/30 border-border/60"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Action (Symbol)</label>
                  <Input 
                    value={formData.action} 
                    onChange={e => setFormData({...formData, action: e.target.value})}
                    className="bg-secondary/30 border-border/60"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Target Address (Contract)</label>
                <Input 
                  value={formData.target} 
                  onChange={e => setFormData({...formData, target: e.target.value})}
                  placeholder="C..."
                  className="bg-secondary/30 border-border/60"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Short Description</label>
                <Input 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="bg-secondary/30 border-border/60"
                  required
                />
              </div>
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Sending..." : "Submit Proposal to DAO"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Summary/Admin */}
      <Card>
        <CardHeader>
          <CardTitle>{t("summary.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">{t("summary.contract")}</div>
              <div className="truncate text-foreground">{ids.GOVERNANCE_CONTRACT_ID || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{t("summary.current_admin")}</div>
              <div className="truncate text-foreground max-w-[32ch]">{governance?.admin || "GAY3LAQYJDER5XXZLM3XFCZNFEZAY26G3JXZV7GAXF7IDEQR3DKDK2TJ"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{t("summary.open_proposals")}</div>
              <div className="text-foreground">{openProposals.length}</div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            {explorerUrl ? (
              <a href={explorerUrl} target="_blank" rel="noreferrer" className="px-3 py-2 rounded bg-secondary/30 border border-border/60">{t("summary.view_explorer")}</a>
            ) : null}
            <Link href="/docs" className="px-3 py-2 rounded bg-secondary/30 border border-border/60">{t("summary.docs")}</Link>
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
            <div className="text-sm text-muted-foreground">{t("open.empty")}</div>
          ) : (
            <div className="space-y-4">
              {openProposals.map((p) => (
                <div key={p.id} className="rounded bg-card/50 border border-border/60 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-foreground text-sm">{p.title}</div>
                      <div className="text-xs text-muted-foreground">{t("open.author", { author: p.author ?? "" })}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded bg-secondary/30 border border-border/60 text-foreground">{p.status}</span>
                      <span className="text-[10px] px-2 py-1 rounded bg-primary/10 border border-primary/25 text-primary uppercase">{p.badge}</span>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">{t("open.end")}</div>
                      <div className="text-foreground">{p.endsAt}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">{t("open.remaining")}</div>
                      <div className="text-foreground">{p.remaining}</div>
                    </div>
                    <div className="sm:col-span-2">
                      <div className="text-xs text-muted-foreground">{t("open.partial_results")}</div>
                      <Progress value={p.votes.yes} className="mt-1" />
                      <div className="text-xs text-muted-foreground mt-1">{t("open.yes_no", { yes: p.votes.yes, no: p.votes.no })}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.status === "Succeeded" && (
                        <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => handleQueue(p.id)}>
                          Queue
                        </Button>
                      )}
                      {p.status === "Queued" && (
                        <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => handleExecute(p.id)}>
                          Execute
                        </Button>
                      )}
                      {!userVotes[p.id] && p.status === "Open" && (
                        <Button size="sm" variant="outline" className="text-xs">Vote Now</Button>
                      )}
                      {userVotes[p.id] && (
                        <span className="text-xs text-muted-foreground">Voted {userVotes[p.id]}</span>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2 text-xs">
                    <Link href={`/governance/${p.id}`} className="px-2 py-1 rounded bg-secondary/30 border border-border/60">{t("open.details")}</Link>
                    <Link href={`/governance/${p.id}#discussion`} className="px-2 py-1 rounded bg-secondary/30 border border-border/60">{t("open.discussion")}</Link>
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
            <div className="text-sm text-muted-foreground">{t("history.empty")}</div>
          ) : (
            <div className="space-y-2">
              {pastProposals.map((h) => (
                <div key={h.id} className="flex items-center justify-between bg-card/50 border border-border/60 rounded px-3 py-2 text-sm">
                  <div className="text-foreground">{h.date} • {h.title}</div>
                  <div className="text-xs text-muted-foreground">{t("history.status_voters", { status: h.status, voters: h.voters })}</div>
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
          <ul className="list-disc pl-5 text-sm space-y-1 text-muted-foreground">
            <li>{t("education.item1")}</li>
            <li>{t("education.item2")}</li>
            <li>{t("education.item3")}</li>
          </ul>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <Link href="/docs" className="px-3 py-2 rounded bg-secondary/30 border border-border/60">{t("education.learn_more")}</Link>
            {explorerUrl ? (
              <a href={explorerUrl} target="_blank" rel="noreferrer" className="px-3 py-2 rounded bg-secondary/30 border border-border/60">{t("education.view_contracts")}</a>
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
          <ul className="list-disc pl-5 text-sm space-y-1 text-primary">
            <li>{t("notices.item1")}</li>
            <li>{t("notices.item2")}</li>
          </ul>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
