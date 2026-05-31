"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, UserCheck, Key, RefreshCcw, Plus, Activity, Clock, BadgeCheck, FileText } from "lucide-react";
import { useWalletStore } from "@/state/wallet";
import { buildInvokeTransaction, submitSignedXdr } from "@/lib/soroban/invoke";

type Credential = {
  id: string;
  type: string;
  issuer: string;
  status: string;
  issuedAt: string;
  onChainProof?: string;
};

type IssuanceStatus = {
  status: "operational" | "degraded";
  available: boolean;
  reason: string | null;
};

export default function SsiWallet({ initialCredentials }: { initialCredentials: Credential[] }) {
  const [credentials, setCredentials] = useState<Credential[]>(initialCredentials);
  const [isMinting, setIsMinting] = useState(false);
  const [showKycForm, setShowKycForm] = useState(false);
  const [mintError, setMintError] = useState<string | null>(null);
  const [issuanceStatus, setIssuanceStatus] = useState<IssuanceStatus | null>(null);
  const walletConnected = useWalletStore((s) => s.connected);
  const walletAddress = useWalletStore((s) => s.address);
  const walletNetwork = useWalletStore((s) => s.network);

  useEffect(() => {
    let active = true;

    const loadIssuanceStatus = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/ssi/status`, {
          cache: "no-store",
        });
        if (!response.ok) return;

        const data = await response.json() as IssuanceStatus;
        if (!active) return;
        setIssuanceStatus(data);
      } catch {
        // Keep UI usable even when backend status endpoint is temporarily unreachable.
      }
    };

    loadIssuanceStatus();
    return () => {
      active = false;
    };
  }, []);

  const handleKycSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!walletConnected || !walletAddress) {
      setMintError("Conecte uma carteira Stellar antes de emitir uma credencial.");
      return;
    }
    if (walletNetwork !== "testnet") {
      setMintError("Troque a carteira para a Stellar testnet antes de emitir a credencial.");
      return;
    }
    if (issuanceStatus && !issuanceStatus.available) {
      setMintError(issuanceStatus.reason || "Servico de emissao SSI indisponivel no momento.");
      return;
    }

    setIsMinting(true);
    setMintError(null);

    const formData = new FormData(e.currentTarget);
    const type = formData.get("type") as string;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/ssi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAddress: walletAddress,
          type,
          issuer: "stellaro-identity-provider"
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null) as { message?: string } | null;
        throw new Error(errorBody?.message || "SSI issuance failed");
      }

      const created = await response.json() as {
        id: string;
        type: string;
        issuer: string;
        status: string;
        createdAt?: string;
        txHash?: string;
      };

      const newCred: {
        id: string;
        type: string;
        issuer: string;
        status: string;
        issuedAt: string;
        onChainProof?: string;
      } = {
        id: created.id,
        type: created.type,
        issuer: created.issuer,
        status: created.status,
        issuedAt: created.createdAt || new Date().toISOString(),
        onChainProof: created.txHash,
      };

      if (created.txHash) {
        console.log("On-chain registration confirmed with txHash:", created.txHash);
      }

      setCredentials(prev => [newCred, ...prev]);
      setShowKycForm(false);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Nao foi possivel emitir a credencial na testnet.";
      setMintError(message);
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-foreground p-6 md:p-12 font-sans selection:bg-primary/20">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header Section */}
        <header className="relative p-8 rounded-3xl overflow-hidden border border-border/60 bg-card/50 backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-[rgba(197,135,230,0.10)]" />
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/15 rounded-full blur-[80px]" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary font-medium tracking-wide text-sm uppercase">
                <ShieldCheck className="w-5 h-5" />
                <span>Decentralized Identity</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">
                SSI Wallet
              </h1>
              <p className="text-muted-foreground max-w-xl text-lg">
                Your identity, your control. Issue and manage verifiable credentials (VCs) to interact with the Stellaro ecosystem and access RWA with full compliance.
              </p>
              <div className="text-sm text-muted-foreground">
                {walletAddress ? `Connected wallet: ${walletAddress}` : "No Stellar wallet connected."}
              </div>
            </div>

            <button 
              onClick={() => setShowKycForm(!showKycForm)}
              disabled={issuanceStatus ? !issuanceStatus.available : false}
              className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold text-foreground transition-all duration-300 bg-primary/10 border border-primary/30 rounded-full hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_2rem_-0.5rem_rgba(212,168,106,0.55)]"
            >
              <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
              <span>New Credential</span>
            </button>
          </div>
        </header>

        {issuanceStatus && !issuanceStatus.available ? (
          <div className="rounded-2xl border border-primary/30 bg-secondary/20 px-5 py-4 text-foreground">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">SSI issuance status: degraded</p>
            <p className="mt-1 text-sm">{issuanceStatus.reason || "SSI issuance is temporarily unavailable."}</p>
          </div>
        ) : null}

        {/* Dynamic KYC Form */}
        {showKycForm && (
          <div className="p-8 rounded-3xl border border-border/60 bg-card/50 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                <UserCheck className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">Start KYC Process</h2>
            </div>
            
            <form onSubmit={handleKycSubmit} className="space-y-6">
              {mintError ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {mintError}
                </div>
              ) : null}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Credential Type</label>
                  <select 
                    name="type" 
                    title="KYC credential type"
                    aria-label="Credential type"
                    className="w-full bg-secondary/30 border border-border/60 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all appearance-none"
                    required
                  >
                    <option value="KYCVerified">KYC Verified (Level 1)</option>
                    <option value="ProofOfAddress">Proof of Address</option>
                    <option value="AccreditedInvestor">Accredited Investor</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Connected Wallet</label>
                  <input
                    type="text"
                    disabled
                    value={walletAddress || "Connect a wallet to continue"}
                    title="Connected wallet address"
                    className="w-full bg-secondary/20 border border-border/60 rounded-xl px-4 py-3 text-muted-foreground cursor-not-allowed"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Authorized Issuer</label>
                  <input 
                    type="text" 
                    disabled 
                    value="Stellaro Identity Oracle"
                    title="Authorized issuer"
                    placeholder="Stellaro Identity Oracle"
                    className="w-full bg-secondary/20 border border-border/60 rounded-xl px-4 py-3 text-muted-foreground cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-start gap-3">
                <Key className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  When issuing this credential, a cryptographic proof will be recorded on the Soroban blockchain.
                  Your personal data stays secure off-chain, ensuring LGPD compliance using selective disclosure.
                </p>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowKycForm(false)}
                  className="px-6 py-2.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={
                    isMinting ||
                    !walletConnected ||
                    !walletAddress ||
                    walletNetwork !== "testnet" ||
                    (issuanceStatus ? !issuanceStatus.available : false)
                  }
                  className="relative inline-flex items-center justify-center gap-2 px-8 py-2.5 font-semibold text-primary-foreground bg-primary rounded-full hover:bg-primary/90 transition-all disabled:opacity-70 disabled:cursor-wait"
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
              <BadgeCheck className="w-6 h-6 text-primary" />
              Your Credentials
            </h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/20 px-3 py-1.5 rounded-full border border-border/60">
              <Activity className="w-4 h-4 text-primary" />
              <span>{credentials.length} Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {credentials.map((cred) => (
              <div 
                key={cred.id}
                className="group relative bg-card/40 border border-border/60 rounded-2xl p-6 overflow-hidden hover:border-primary/40 transition-all duration-500 hover:shadow-[0_8px_30px_rgba(212,168,106,0.12)] backdrop-blur-xl"
              >
                {/* Decoration */}
                <div className="absolute -right-12 -top-12 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/15 transition-colors duration-500" />
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-secondary/20 rounded-xl border border-border/60 group-hover:border-primary/30 transition-colors">
                      {cred.type.includes('KYC') ? <UserCheck className="w-6 h-6 text-primary" /> : 
                       cred.type.includes('Address') ? <ShieldCheck className="w-6 h-6 text-primary" /> : 
                       <BadgeCheck className="w-6 h-6 text-primary" />}
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      {cred.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="mb-4 flex-grow">
                    <h3 className="text-xl font-semibold mb-1 text-foreground transition-colors">{cred.type}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5" />
                      Issuer: {cred.issuer}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Issued on {new Date(cred.issuedAt).toLocaleDateString()}</span>
                    </div>
                    <button className="text-primary hover:text-primary/90 transition-colors font-medium">
                      View On-chain Proof
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {credentials.length === 0 && (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-center bg-secondary/10 border border-border/60 rounded-3xl border-dashed">
                <div className="p-4 bg-secondary/20 rounded-full mb-4 border border-border/60">
                  <ShieldCheck className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-1">No credentials found</h3>
                <p className="text-muted-foreground text-sm max-w-sm">You have not issued any verifiable credentials yet. Start the KYC process to begin.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
