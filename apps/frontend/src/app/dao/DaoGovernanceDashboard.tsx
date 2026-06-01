"use client";

import { Vote, AlertCircle, Clock, CheckCircle2, XCircle } from "lucide-react";

type Proposal = {
  id: string;
  title: string;
  action: string;
  target: string;
  status: string;
  votesFor: number;
  votesAgainst: number;
  endLedger: number;
};

export default function DaoGovernanceDashboard({ initialProposals }: { initialProposals: Proposal[] }) {
  const proposals = initialProposals;

  return (
    <div className="min-h-screen bg-transparent text-foreground p-6 md:p-12 font-sans selection:bg-primary/20">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <header className="relative p-10 rounded-3xl overflow-hidden border border-border/60 bg-card/50 backdrop-blur-xl shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-[rgba(197,135,230,0.10)]" />
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary/15 rounded-full blur-[80px]" />
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                <Vote className="w-4 h-4" />
                <span>Decentralized Governance</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
                DAO Governance
              </h1>
              <p className="text-muted-foreground text-lg">
                Propose, debate, and vote on the protocol's future. Approved decisions are executed automatically on the Soroban network through secure timelocks.
              </p>
            </div>

            <button
              disabled
              className="px-6 py-3.5 bg-primary text-primary-foreground font-bold rounded-xl transition-colors shrink-0 opacity-60"
              title="Criação/voto de propostas requer assinatura via wallet e fluxo on-chain."
            >
              Create New Proposal
            </button>
          </div>
        </header>

        <div className="rounded-2xl border border-border/60 bg-secondary/10 p-4 text-sm text-muted-foreground">
          Para evitar dados simulados e envio de secrets via API, este painel é somente leitura.
          Criação e votação exigem assinatura via wallet e submissão on-chain.
        </div>

        {/* Proposals Grid */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            Open Proposals
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {proposals.map(proposal => {
              const totalVotes = proposal.votesFor + proposal.votesAgainst;
              const percentFor = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0;
              const percentAgainst = totalVotes > 0 ? (proposal.votesAgainst / totalVotes) * 100 : 0;

              return (
                <div key={proposal.id} className="p-6 rounded-3xl bg-card/40 border border-border/60 hover:border-primary/40 transition-all backdrop-blur-xl">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold text-muted-foreground tracking-wider uppercase">{proposal.id}</span>
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary border border-primary/20">
                      {proposal.status}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-foreground mb-2">{proposal.title}</h3>
                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className="px-2 py-1 bg-secondary/20 rounded border border-border/60 text-xs text-muted-foreground font-mono">Action: {proposal.action}</span>
                    <span className="px-2 py-1 bg-secondary/20 rounded border border-border/60 text-xs text-muted-foreground font-mono">Target: {proposal.target.slice(0, 8)}...</span>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-primary font-medium">For ({proposal.votesFor.toLocaleString("en-US")} STLT)</span>
                      <span className="text-destructive font-medium">Against ({proposal.votesAgainst.toLocaleString("en-US")} STLT)</span>
                    </div>
                    <div className="space-y-2">
                      <progress className="h-2 w-full accent-[hsl(var(--primary))]" value={percentFor} max={100} />
                      <progress className="h-2 w-full accent-[hsl(var(--destructive))]" value={percentAgainst} max={100} />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button 
                      disabled
                      className="flex-1 py-2.5 bg-primary/10 text-primary font-semibold rounded-xl border border-primary/30 transition-colors flex items-center justify-center gap-2 opacity-60"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Vote For
                    </button>
                    <button 
                      disabled
                      className="flex-1 py-2.5 bg-destructive/10 text-destructive font-semibold rounded-xl border border-destructive/30 transition-colors flex items-center justify-center gap-2 opacity-60"
                    >
                      <XCircle className="w-4 h-4" /> Vote Against
                    </button>
                  </div>
                </div>
              );
            })}
            {proposals.length === 0 ? (
              <div className="col-span-full p-10 rounded-3xl bg-card/30 border border-border/60 text-center">
                <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <div className="text-lg font-semibold text-foreground">Sem propostas</div>
                <div className="text-sm text-muted-foreground mt-2">
                  Nenhuma proposta retornada pela API.
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
