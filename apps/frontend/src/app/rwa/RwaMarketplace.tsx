"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Building, Landmark, Percent, Clock, ArrowRight, Gavel, FileText, CheckCircle2, ShieldAlert, Loader2 } from "lucide-react";
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
  const [selectedAsset, setSelectedAsset] = useState<RwaAssetView | null>(null);
  const [bidAmount, setBidAmount] = useState<string>("");
  const [isBidding, setIsBidding] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const walletConnected = useWalletStore((s) => s.connected);
  const walletAddress = useWalletStore((s) => s.address);
  const walletNetwork = useWalletStore((s) => s.network);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [walletData, setWalletData] = useState<{ xlm: string; stlt: string }>({ xlm: "0", stlt: "0" });

  const { hasKyc, isLoading: isSsiLoading, error: ssiError } = useSSI({
    walletAddress,
    enabled: walletConnected && walletNetwork === "testnet",
  });

  const walletStatus = useMemo(() => {
    if (!walletConnected || !walletAddress) {
      return {
        label: "Carteira desconectada",
        note: "Conecte uma carteira Stellar para liberar dados reais de saldo e KYC.",
      };
    }

    if (walletNetwork !== "testnet") {
      return {
        label: "Rede incorreta",
        note: "Troque a carteira para Stellar testnet para validar KYC e operar RWA.",
      };
    }

    return {
      label: "Carteira conectada",
      note: "Dados carregados da carteira conectada na Stellar testnet.",
    };
  }, [walletAddress, walletConnected, walletNetwork]);

  useEffect(() => {
    let active = true;

    async function loadWalletData() {
      if (!walletConnected || !walletAddress || walletNetwork !== "testnet") {
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
        setWalletError("Nao foi possivel carregar os saldos reais da carteira na testnet.");
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

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset || !walletAddress || walletNetwork !== "testnet" || !hasKyc) return;

    setIsBidding(true);
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsBidding(false);
    setSuccessMessage(`Oferta preparada para a carteira ${walletAddress} no ativo ${selectedAsset.name}. Integracao de envio da transacao ainda pendente.`);
    setTimeout(() => {
      setSuccessMessage("");
      setSelectedAsset(null);
      setBidAmount("");
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-6 md:p-12 font-sans selection:bg-amber-500/30">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Hero Header */}
        <header className="relative p-10 rounded-[2.5rem] overflow-hidden border border-slate-800/60 bg-slate-900/40 backdrop-blur-2xl shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-orange-500/10" />
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/20 rounded-full blur-[100px]" />
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 text-sm font-medium border border-amber-500/20">
                <Landmark className="w-4 h-4" />
                <span>Regulated CVM Market</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
                Premium <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-600">RWA Marketplace</span>
              </h1>
              <p className="text-lg text-slate-400 leading-relaxed">
                Invest in fractions of luxury real estate, debentures, and receivables with instant settlement on the Soroban network. Guaranteed yields audited by decentralized oracles.
              </p>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-300">
                <div className="font-semibold text-white">{walletStatus.label}</div>
                <div className="mt-1 text-slate-400">{walletStatus.note}</div>
                {walletAddress ? <div className="mt-2 break-all text-xs text-slate-500">{walletAddress}</div> : null}
              </div>
            </div>
            
            <div className="flex flex-col gap-3 min-w-[200px]">
              <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 backdrop-blur-md">
                <div className="text-sm text-slate-500 mb-1">Total Value Locked</div>
                <div className="text-2xl font-bold text-amber-400">R$ 142.5M</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 backdrop-blur-md">
                <div className="text-sm text-slate-500 mb-1">Carteira conectada</div>
                <div className="text-lg font-bold text-white">{walletConnected ? walletNetwork : "offline"}</div>
                <div className="mt-2 text-xs text-slate-400">XLM: {walletLoading ? "..." : walletData.xlm}</div>
                <div className="text-xs text-slate-400">STLT: {walletLoading ? "..." : walletData.stlt}</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 backdrop-blur-md">
                <div className="text-sm text-slate-500 mb-1">KYC testnet</div>
                <div className={`text-lg font-bold ${hasKyc ? "text-emerald-400" : "text-amber-400"}`}>
                  {isSsiLoading ? "Verificando" : hasKyc ? "Validado" : "Nao validado"}
                </div>
              </div>
            </div>
          </div>
        </header>

        {(walletError || ssiError) && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-950/30 p-4 text-sm text-amber-100">
            {walletError || ssiError}
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <p className="text-emerald-200">{successMessage}</p>
          </div>
        )}

        {/* Marketplace Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-white">Assets Available for Auction</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.map((asset) => (
              <div 
                key={asset.id}
                className="group flex flex-col bg-slate-900/40 border border-slate-800 rounded-[2rem] overflow-hidden hover:border-amber-500/50 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(245,158,11,0.15)]"
              >
                {/* Asset Image Placeholder */}
                <div className="h-48 bg-slate-800 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent z-10" />
                  {asset.assetClass === 'real-estate' ? (
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:opacity-60 transition-opacity duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:opacity-60 transition-opacity duration-700 group-hover:scale-105" />
                  )}
                  
                  <div className="absolute top-4 right-4 z-20">
                    <span className="px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-xs font-semibold text-white border border-slate-700 uppercase tracking-wider">
                      {asset.status}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-grow relative z-20 bg-slate-900">
                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-amber-500 text-xs font-bold uppercase tracking-wider mb-2">
                      {asset.assetClass === 'real-estate' ? <Building className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                      {asset.assetClass.replace('-', ' ')}
                    </div>
                    <h3 className="text-xl font-bold text-white line-clamp-1">{asset.name}</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium mb-1">
                        <Percent className="w-3.5 h-3.5" /> Annual Yield
                      </div>
                      <div className="text-lg font-bold text-emerald-400">{(asset.annualYieldBps / 100).toFixed(2)}%</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium mb-1">
                        <Clock className="w-3.5 h-3.5" /> Auction ends
                      </div>
                      <div className="text-sm font-bold text-slate-300 mt-1">48h 12m</div>
                    </div>
                  </div>

                  {!walletConnected || walletNetwork !== "testnet" || !hasKyc ? (
                    <Link
                      href="/ssi"
                      className="mt-auto w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800 text-slate-400 font-bold border border-slate-700 hover:bg-slate-700 hover:text-slate-200 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isSsiLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ShieldAlert className="w-4 h-4 text-amber-500" />
                      )}
                      {!walletConnected
                        ? "Conectar carteira"
                        : walletNetwork !== "testnet"
                          ? "Trocar para testnet"
                          : "Completar KYC real"}
                    </Link>
                  ) : (
                    <button 
                      onClick={() => setSelectedAsset(asset)}
                      className="mt-auto w-full group/btn relative flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-amber-500 text-slate-950 font-bold overflow-hidden transition-transform active:scale-95"
                    >
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                      <span className="relative flex items-center gap-2">
                        <Gavel className="w-4 h-4" />
                        Place Bid / Invest
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bidding Modal */}
        {selectedAsset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setSelectedAsset(null)} />
            <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="p-6">
                <h3 className="text-2xl font-bold text-white mb-2">Make an Offer</h3>
                <p className="text-slate-400 text-sm mb-6">
                  You are preparing an investment order for <strong>{selectedAsset.name}</strong> using the connected Stellar testnet wallet. KYC is validated before enabling this flow.
                </p>

                <form onSubmit={handlePlaceBid} className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Bid Amount (BRL)</label>
                    <div className="relative mt-1.5">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">R$</span>
                      <input 
                        type="number" 
                        required
                        min="1000"
                        step="100"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white font-medium focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        placeholder="5000"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Current minimum bid: R$ 4,900.00</p>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setSelectedAsset(null)}
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-700 text-slate-300 font-medium hover:bg-slate-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isBidding}
                      className="flex-1 px-4 py-3 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                      {isBidding ? (
                        <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                      ) : (
                        <>Confirm <ArrowRight className="w-4 h-4" /></>
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
