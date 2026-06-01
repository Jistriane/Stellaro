"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getContractIds, hasValidVc } from "@/lib/soroban";
import { useTranslations } from "next-intl";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

import { ShieldCheck, ShieldAlert, BrainCircuit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useWalletStore } from "@/state/wallet";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function GovernancePage() {
  const t = useTranslations("governance");
  const [dao, setDao] = useState<{
    contractId: string | null;
    total: number;
    proposals: any[];
    timestamp: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCompliant, setIsCompliant] = useState<boolean | null>(null);
  const address = useWalletStore((s) => s.address);

  // Enable real-time updates when the wallet connects
  useRealTimeUpdates();
  
  useEffect(() => {
    async function loadData() {
      try {
        setError(null);
        const [daoRes, compliant] = await Promise.all([
          (async () => {
            const r = await fetch(`${apiUrl}/chain/dao/proposals?start=1&limit=20`, { cache: "no-store" });
            if (!r.ok) {
              setError("Falha ao carregar propostas");
              return null;
            }
            return (await r.json()) as any;
          })(),
          address ? hasValidVc(address) : Promise.resolve(null),
        ]);
        setDao({
          contractId: daoRes?.contractId ?? null,
          total: Number(daoRes?.total ?? 0) || 0,
          proposals: Array.isArray(daoRes?.proposals) ? daoRes.proposals : [],
          timestamp: daoRes?.timestamp ?? null,
        });
        setIsCompliant(compliant);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setDao({
          contractId: null,
          total: 0,
          proposals: [],
          timestamp: null,
        });
        setIsCompliant(null);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [address]);

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
            disabled
          >
            New Proposal
          </Button>
        </div>
      </div>

      <Card className="border-border/60 bg-card/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Propostas (on-chain)</CardTitle>
          <Button size="sm" variant="outline" className="border-primary/25 text-primary hover:bg-primary/10 flex items-center gap-2" disabled>
            <BrainCircuit className="w-4 h-4" />
            Draft com IA
          </Button>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-sm text-destructive">{error}</div>
          ) : null}
          {dao?.proposals?.length ? (
            <div className="space-y-2">
              {dao.proposals.map((p, idx) => (
                <div key={idx} className="rounded border border-border/60 bg-card/50 px-3 py-2 text-sm">
                  <div className="text-foreground break-words">{JSON.stringify(p)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Nenhuma proposta encontrada.</div>
          )}
          <div className="mt-3 text-xs text-muted-foreground">Atualizado: {dao?.timestamp ? new Date(dao.timestamp).toLocaleString() : "—"}</div>
        </CardContent>
      </Card>

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
              <div className="truncate text-foreground">{address || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{t("summary.open_proposals")}</div>
              <div className="text-foreground"><b>{dao?.total ?? 0}</b></div>
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
