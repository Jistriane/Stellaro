"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Building, Landmark, Percent, Clock, FileText, ShieldAlert, Loader2 } from "lucide-react";
import { useSSI } from "@/hooks/useSSI";
import { getWalletBalances } from "@/lib/soroban";
import { useWalletStore } from "@/state/wallet";

type RwaAssetView = {
  id: string;
  name: string;
  assetClass: string;
  status: string;
  whitelistRequired: boolean;
  annualYieldBps: number;
};

export default function RwaMarketplace({ initialAssets }: { initialAssets: RwaAssetView[] }) {
  const [assets] = useState<RwaAssetView[]>(initialAssets);
  const walletConnected = useWalletStore((s) => s.connected);
  const walletAddress = useWalletStore((s) => s.address);
  const walletNetwork = useWalletStore((s) => s.network);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [walletData, setWalletData] = useState<{ xlm: string; stlt: string }>({ xlm: "0", stlt: "0" });

  const { hasKyc, isLoading: isSsiLoading, error: ssiError } = useSSI({
    walletAddress,
    enabled: walletConnected && walletNetwork === "public",
  });

  const walletStatus = useMemo(() => {
    if (!walletConnected || !walletAddress) {
      return {
        label: "Carteira desconectada",
        note: "Conecte uma carteira Stellar para liberar dados reais de saldo e KYC.",
      };
    }

    if (walletNetwork !== "public") {
      return {
        label: "Rede incorreta",
        note: "Troque a carteira para a Stellar public network para validar KYC e operar RWA.",
      };
    }

    return {
      label: "Carteira conectada",
      note: "Dados carregados da carteira conectada na Stellar public network.",
    };
  }, [walletAddress, walletConnected, walletNetwork]);

  useEffect(() => {
    let active = true;

    async function loadWalletData() {
      if (!walletConnected || !walletAddress || walletNetwork !== "public") {
        setWalletData({ xlm: "0", stlt: "0" });
        setWalletError(null);
        setWalletLoading(false);
        return;
      }

      setWalletLoading(true);
      setWalletError(null);

      try {
        const balances = await getWalletBalances(walletAddress);
        if (!active) return;
        setWalletData({ xlm: balances.xlm, stlt: balances.stlt });
      } catch {
        if (!active) return;
        setWalletData({ xlm: "0", stlt: "0" });
        setWalletError("Nao foi possivel carregar os saldos reais da carteira na public network.");
      } finally {
        if (!active) return;
        setWalletLoading(false);
      }
    }

    void loadWalletData();

    return () => {
      active = false;
    };
  }, [walletAddress, walletConnected, walletNetwork]);

  return (
    <div className="min-h-screen bg-transparent text-foreground p-6 md:p-12 font-sans selection:bg-primary/20">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Hero Header */}
        <header className="relative p-10 rounded-[2.5rem] overflow-hidden border border-border/60 bg-card/50 backdrop-blur-2xl shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-[rgba(197,135,230,0.10)]" />
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/15 rounded-full blur-[100px]" />
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                <Landmark className="w-4 h-4" />
                <span>Regulated CVM Market</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
                Premium <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-[rgb(197,135,230)]">RWA Marketplace</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Invest in fractions of luxury real estate, debentures, and receivables with instant settlement on the Soroban network. Guaranteed yields audited by decentralized oracles.
              </p>
              <div className="rounded-2xl border border-border/60 bg-secondary/20 p-4 text-sm text-muted-foreground">
                <div className="font-semibold text-foreground">{walletStatus.label}</div>
                <div className="mt-1 text-muted-foreground">{walletStatus.note}</div>
                {walletAddress ? <div className="mt-2 break-all text-xs text-muted-foreground">{walletAddress}</div> : null}
              </div>
            </div>
            
            <div className="flex flex-col gap-3 min-w-[200px]">
              <div className="p-4 rounded-2xl bg-secondary/20 border border-border/60 backdrop-blur-md">
                <div className="text-sm text-muted-foreground mb-1">Total Value Locked</div>
                <div className="text-2xl font-bold text-muted-foreground">—</div>
              </div>
              <div className="p-4 rounded-2xl bg-secondary/20 border border-border/60 backdrop-blur-md">
                <div className="text-sm text-muted-foreground mb-1">Carteira conectada</div>
                <div className="text-lg font-bold text-foreground">{walletConnected ? walletNetwork : "offline"}</div>
                <div className="mt-2 text-xs text-muted-foreground">XLM: {walletLoading ? "..." : walletData.xlm}</div>
                <div className="text-xs text-muted-foreground">STLT: {walletLoading ? "..." : walletData.stlt}</div>
              </div>
              <div className="p-4 rounded-2xl bg-secondary/20 border border-border/60 backdrop-blur-md">
                <div className="text-sm text-muted-foreground mb-1">KYC</div>
                <div className={`text-lg font-bold ${hasKyc ? "text-primary" : "text-muted-foreground"}`}>
                  {isSsiLoading ? "Verificando" : hasKyc ? "Validado" : "Nao validado"}
                </div>
              </div>
            </div>
          </div>
        </header>

        {(walletError || ssiError) && (
          <div className="rounded-2xl border border-primary/30 bg-secondary/20 p-4 text-sm text-foreground">
            {walletError || ssiError}
          </div>
        )}

        {/* Marketplace Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-foreground">Assets Available for Auction</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.map((asset) => (
              <div 
                key={asset.id}
                className="group flex flex-col bg-card/40 border border-border/60 rounded-[2rem] overflow-hidden hover:border-primary/40 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(212,168,106,0.15)]"
              >
                {/* Asset Image Placeholder */}
                <div className="h-48 bg-secondary/30 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10" />
                  <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_50%_20%,rgba(var(--stellaro-accent-rgb),0.20),transparent_60%)] opacity-60" />
                  
                  <div className="absolute top-4 right-4 z-20">
                    <span className="px-3 py-1 rounded-full bg-background/60 backdrop-blur-md text-xs font-semibold text-foreground border border-border/60 uppercase tracking-wider">
                      {asset.status}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-grow relative z-20 bg-card">
                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider mb-2">
                      {asset.assetClass === 'real-estate' ? <Building className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                      {asset.assetClass.replace('-', ' ')}
                    </div>
                    <h3 className="text-xl font-bold text-foreground line-clamp-1">{asset.name}</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-3 rounded-2xl bg-secondary/20 border border-border/60">
                      <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium mb-1">
                        <Percent className="w-3.5 h-3.5" /> Annual Yield
                      </div>
                      <div className="text-lg font-bold text-primary">{(asset.annualYieldBps / 100).toFixed(2)}%</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-secondary/20 border border-border/60">
                      <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium mb-1">
                        <Clock className="w-3.5 h-3.5" /> Auction ends
                      </div>
                      <div className="text-sm font-bold text-muted-foreground mt-1">—</div>
                    </div>
                  </div>

                  {!walletConnected || walletNetwork !== "public" || !hasKyc ? (
                    <Link
                      href="/ssi"
                      className="mt-auto w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-secondary/20 text-muted-foreground font-bold border border-border/60 hover:bg-secondary/40 hover:text-foreground transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isSsiLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ShieldAlert className="w-4 h-4 text-primary" />
                      )}
                      {!walletConnected
                        ? "Conectar carteira"
                        : walletNetwork !== "public"
                          ? "Trocar para public"
                          : "Completar KYC real"}
                    </Link>
                  ) : (
                    <button 
                      disabled
                      className="mt-auto w-full group/btn relative flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold overflow-hidden transition-transform active:scale-95"
                    >
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                      <span className="relative flex items-center gap-2">
                        Operar on-chain
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
