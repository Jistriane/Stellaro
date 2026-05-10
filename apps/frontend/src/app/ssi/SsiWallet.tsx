"use client";

import { useState } from "react";
import { ShieldCheck, UserCheck, Key, RefreshCcw, Plus, Activity, Clock, BadgeCheck } from "lucide-react";

type Credential = {
  id: string;
  type: string;
  issuer: string;
  status: string;
  issuedAt: string;
};

export default function SsiWallet({ initialCredentials }: { initialCredentials: Credential[] }) {
  const [credentials, setCredentials] = useState<Credential[]>(initialCredentials);
  const [isMinting, setIsMinting] = useState(false);
  const [showKycForm, setShowKycForm] = useState(false);

  const handleKycSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsMinting(true);

    const formData = new FormData(e.currentTarget);
    const type = formData.get("type") as string;
    
    // Simulate network delay and KYC process
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/ssi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAddress: "GDK...USER", // Mock user address
          type,
          issuer: "stellaro-identity-provider"
        }),
      });

      if (response.ok) {
        // Optimistic UI update
        const newCred = {
          id: `vc-${Date.now()}`,
          type,
          issuer: "stellaro-identity-provider",
          status: "active",
          issuedAt: new Date().toISOString(),
        };
        setCredentials(prev => [newCred, ...prev]);
        setShowKycForm(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6 md:p-12 font-sans selection:bg-emerald-500/30">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header Section */}
        <header className="relative p-8 rounded-3xl overflow-hidden border border-slate-800/60 bg-slate-900/40 backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-sky-500/10" />
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px]" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-medium tracking-wide text-sm uppercase">
                <ShieldCheck className="w-5 h-5" />
                <span>Decentralized Identity</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                SSI Wallet
              </h1>
              <p className="text-slate-400 max-w-xl text-lg">
                Your identity, your control. Issue and manage verifiable credentials (VCs) to interact with the Stellaro ecosystem and access RWA with full compliance.
              </p>
            </div>

            <button 
              onClick={() => setShowKycForm(!showKycForm)}
              className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold text-white transition-all duration-300 bg-emerald-500/10 border border-emerald-500/30 rounded-full hover:bg-emerald-500 hover:text-slate-950 hover:shadow-[0_0_2rem_-0.5rem_#10b981]"
            >
              <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
              <span>New Credential</span>
            </button>
          </div>
        </header>

        {/* Dynamic KYC Form */}
        {showKycForm && (
          <div className="p-8 rounded-3xl border border-emerald-500/20 bg-slate-900/50 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <UserCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-semibold">Start KYC Process</h2>
            </div>
            
            <form onSubmit={handleKycSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Credential Type</label>
                  <select 
                    name="type" 
                    title="KYC credential type"
                    aria-label="Credential type"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all appearance-none"
                    required
                  >
                    <option value="KYCVerified">KYC Verified (Level 1)</option>
                    <option value="ProofOfAddress">Proof of Address</option>
                    <option value="AccreditedInvestor">Accredited Investor</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Authorized Issuer</label>
                  <input 
                    type="text" 
                    disabled 
                    value="Stellaro Identity Oracle"
                    title="Authorized issuer"
                    placeholder="Stellaro Identity Oracle"
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="p-4 bg-emerald-950/30 border border-emerald-500/20 rounded-xl flex items-start gap-3">
                <Key className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-200/80 leading-relaxed">
                  When issuing this credential, a cryptographic proof will be recorded on the Soroban blockchain.
                  Your personal data stays secure off-chain, ensuring LGPD compliance using selective disclosure.
                </p>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowKycForm(false)}
                  className="px-6 py-2.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isMinting}
                  className="relative inline-flex items-center justify-center gap-2 px-8 py-2.5 font-semibold text-slate-950 bg-emerald-400 rounded-full hover:bg-emerald-300 transition-all disabled:opacity-70 disabled:cursor-wait"
                >
                  {isMinting ? (
                    <>
                      <RefreshCcw className="w-4 h-4 animate-spin" />
                      <span>Issuing VC...</span>
                    </>
                  ) : (
                    <span>Confirm and Issue</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Credentials Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <BadgeCheck className="w-6 h-6 text-blue-400" />
              Your Credentials
            </h2>
            <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-800">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>{credentials.length} Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {credentials.map((cred) => (
              <div 
                key={cred.id}
                className="group relative bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 overflow-hidden hover:border-emerald-500/50 transition-all duration-500 hover:shadow-[0_8px_30px_rgb(16,185,129,0.1)] backdrop-blur-sm"
              >
                {/* Decoration */}
                <div className="absolute -right-12 -top-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors duration-500" />
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 group-hover:border-emerald-500/30 transition-colors">
                      {cred.type.includes('KYC') ? <UserCheck className="w-6 h-6 text-emerald-400" /> : 
                       cred.type.includes('Address') ? <ShieldCheck className="w-6 h-6 text-sky-400" /> : 
                       <BadgeCheck className="w-6 h-6 text-purple-400" />}
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {cred.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="mb-4 flex-grow">
                    <h3 className="text-xl font-semibold mb-1 text-slate-100 group-hover:text-white transition-colors">{cred.type}</h3>
                    <p className="text-sm text-slate-500 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5" />
                      Issuer: {cred.issuer}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Issued on {new Date(cred.issuedAt).toLocaleDateString()}</span>
                    </div>
                    <button className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium">
                      View On-chain Proof
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {credentials.length === 0 && (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-center bg-slate-900/20 border border-slate-800/50 rounded-3xl border-dashed">
                <div className="p-4 bg-slate-800/50 rounded-full mb-4">
                  <ShieldCheck className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-medium text-slate-300 mb-1">No credentials found</h3>
                <p className="text-slate-500 text-sm max-w-sm">You have not issued any verifiable credentials yet. Start the KYC process to begin.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
