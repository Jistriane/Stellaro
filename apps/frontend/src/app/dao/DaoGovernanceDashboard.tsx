"use client";

import { useState } from "react";
import { Vote, Sparkles, AlertCircle, Clock, CheckCircle2, XCircle, ArrowRight } from "lucide-react";

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
  const [proposals, setProposals] = useState<Proposal[]>(initialProposals);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [formData, setFormData] = useState({ title: "", action: "", target: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAiDraft = async () => {
    setIsDrafting(true);
    // Simulate AI generation delay
    await new Promise(r => setTimeout(r, 2000));
    setFormData({
      title: "Automatic Risk Threshold Optimization",
      action: "update_risk_params",
      target: "CBRX...9F8A",
      description: "ElizaOS recommendation: reduce risk tolerance in the main vault by 5% due to increased external market volatility over the last 48 hours. This will protect LP funds."
    });
    setIsDrafting(false);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1500));
    
    const newProposal: Proposal = {
      id: `P-${Date.now().toString().slice(-4)}`,
      title: formData.title,
      action: formData.action,
      target: formData.target,
      status: "Active",
      votesFor: 0,
      votesAgainst: 0,
      endLedger: 120000 + 4000
    };
    
    setProposals([newProposal, ...proposals]);
    setShowCreateModal(false);
    setIsSubmitting(false);
    setFormData({ title: "", action: "", target: "", description: "" });
  };

  const handleVote = async (id: string, support: boolean) => {
    // Optimistic UI Update
    setProposals(current => current.map(p => {
      if (p.id === id) {
        return {
          ...p,
          votesFor: support ? p.votesFor + 1000 : p.votesFor,
          votesAgainst: !support ? p.votesAgainst + 1000 : p.votesAgainst
        };
      }
      return p;
    }));
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-6 md:p-12 font-sans selection:bg-violet-500/30">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <header className="relative p-10 rounded-3xl overflow-hidden border border-slate-800/60 bg-slate-900/40 backdrop-blur-xl shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-fuchsia-500/10" />
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-violet-500/20 rounded-full blur-[80px]" />
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 text-violet-400 text-sm font-medium border border-violet-500/20">
                <Vote className="w-4 h-4" />
                <span>Decentralized Governance</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                DAO Governance
              </h1>
              <p className="text-slate-400 text-lg">
                Propose, debate, and vote on the protocol's future. Approved decisions are executed automatically on the Soroban network through secure timelocks.
              </p>
            </div>

            <button 
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3.5 bg-violet-500 hover:bg-violet-400 text-slate-950 font-bold rounded-xl transition-colors shrink-0"
            >
              Create New Proposal
            </button>
          </div>
        </header>

        {/* Proposals Grid */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
            Open Proposals
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {proposals.map(proposal => {
              const totalVotes = proposal.votesFor + proposal.votesAgainst;
              const percentFor = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0;
              const percentAgainst = totalVotes > 0 ? (proposal.votesAgainst / totalVotes) * 100 : 0;

              return (
                <div key={proposal.id} className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800 hover:border-violet-500/30 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold text-slate-500 tracking-wider uppercase">{proposal.id}</span>
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {proposal.status}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-100 mb-2">{proposal.title}</h3>
                  <div className="flex flex-wrap gap-2 mb-6">
                    <span className="px-2 py-1 bg-slate-950 rounded border border-slate-800 text-xs text-slate-400 font-mono">Action: {proposal.action}</span>
                    <span className="px-2 py-1 bg-slate-950 rounded border border-slate-800 text-xs text-slate-400 font-mono">Target: {proposal.target.slice(0, 8)}...</span>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-400 font-medium">For ({proposal.votesFor.toLocaleString("en-US")} STLT)</span>
                      <span className="text-rose-400 font-medium">Against ({proposal.votesAgainst.toLocaleString("en-US")} STLT)</span>
                    </div>
                    <div className="space-y-2">
                      <progress className="h-2 w-full accent-emerald-500" value={percentFor} max={100} />
                      <progress className="h-2 w-full accent-rose-500" value={percentAgainst} max={100} />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleVote(proposal.id, true)}
                      className="flex-1 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold rounded-xl border border-emerald-500/30 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Vote For
                    </button>
                    <button 
                      onClick={() => handleVote(proposal.id, false)}
                      className="flex-1 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold rounded-xl border border-rose-500/30 transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" /> Vote Against
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Create Proposal Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
            <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-white">New Proposal</h3>
                  <button 
                    onClick={handleAiDraft}
                    disabled={isDrafting}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 text-sm font-medium border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
                  >
                    {isDrafting ? <div className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Draft with ElizaOS
                  </button>
                </div>

                <form onSubmit={handleCreateSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Proposal Title</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Risk parameter adjustment"
                      title="Proposal title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full mt-1.5 bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Target Contract</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. CBRX...9F8A"
                        title="Target contract for the proposal"
                        value={formData.target}
                        onChange={(e) => setFormData({...formData, target: e.target.value})}
                        className="w-full mt-1.5 bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Action (Method)</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. update_risk_params"
                        title="Action or method to execute"
                        value={formData.action}
                        onChange={(e) => setFormData({...formData, action: e.target.value})}
                        className="w-full mt-1.5 bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-mono text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Detailed Description</label>
                    <textarea 
                      required
                      rows={4}
                      placeholder="Explain the proposal and the expected impact"
                      title="Detailed proposal description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full mt-1.5 bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500 resize-none"
                    />
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-700 text-slate-300 font-medium hover:bg-slate-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-3 rounded-xl bg-violet-500 text-slate-950 font-bold hover:bg-violet-400 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                      ) : (
                        "Publish On-chain"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
