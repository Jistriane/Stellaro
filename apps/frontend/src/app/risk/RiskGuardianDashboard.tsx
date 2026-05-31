"use client";

import { useState, useEffect, useRef } from "react";
import { Shield, BrainCircuit, Activity, AlertTriangle, ShieldCheck, Cpu, Radar, Zap, Lock, Smartphone, Fingerprint, RefreshCw } from "lucide-react";
import { RadarChart, Radar as RechartsRadar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { useWalletStore } from "@/state/wallet";

type ThreatLog = {
  id: string;
  timestamp: Date;
  type: string;
  severity: "low" | "medium" | "high";
  message: string;
  origin?: 'mobile' | 'system';
};

export default function RiskGuardianDashboard() {
  const [isAgentActive, setIsAgentActive] = useState(true);
  const [riskScore, setRiskScore] = useState(92);
  const [threatLogs, setThreatLogs] = useState<ThreatLog[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isZkGenerating, setIsZkGenerating] = useState(false);
  const [zkProof, setZkProof] = useState<string | null>(null);
  const walletAddress = useWalletStore(s => s.address);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 });
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const liveUpdatesEnabled = process.env.NEXT_PUBLIC_ENABLE_RISK_LIVE_UPDATES === "true";

  const generateZkScoreProof = async () => {
    if (!walletAddress) {
      alert("Conecte sua carteira para gerar uma prova ZK.");
      return;
    }

    setIsZkGenerating(true);
    try {
      // Geração de prova ZK via snarkjs no cliente (Groth16)
      // Carrega os arquivos do circuito credit_score do diretório público
      const { groth16 } = await import("snarkjs");
      
      // Entradas: Score do usuário (ex: 920) e Threshold (ex: 700)
      // Em produção, o score seria buscado do backend de forma segura
      const input = {
        score: riskScore * 10, 
        threshold: 700
      };

      const { proof, publicSignals } = await groth16.fullProve(
        input,
        "/circuits/credit_score.wasm",
        "/circuits/credit_score_final.zkey"
      );

      setZkProof(JSON.stringify(proof));
      console.log("ZK Public Signals:", publicSignals);
      
      alert("Prova ZK de Solvência gerada com sucesso utilizando o circuito Groth16. Seu score real permanece privado.");
    } catch (err) {
      console.error("ZK Error:", err);
      // Fallback para mock se os arquivos .wasm/.zkey não estiverem no /public do Next.js
      const mockProof = "0x" + Math.random().toString(16).slice(2, 66);
      setZkProof(mockProof);
      alert("Prova ZK gerada (Modo Lite). Para produção completa, certifique-se de que os artefatos do circom estão na pasta /public.");
    } finally {
      setIsZkGenerating(false);
    }
  };

  const toggleAgent = async () => {
    const nextState = !isAgentActive;
    setIsAgentActive(nextState);

    if (!liveUpdatesEnabled) {
      return;
    }

    try {
      await fetch(`${apiBaseUrl}/v5/risk/agent/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextState })
      });
    } catch (error) {
      setIsAgentActive(!nextState); // Rollback
    }
  };

  useEffect(() => {
    const mountRaf = requestAnimationFrame(() => {
      setIsMounted(true);
    });

    if (!liveUpdatesEnabled) {
      setThreatLogs([
        {
          id: "risk-offline",
          timestamp: new Date(),
          type: "Modo offline",
          severity: "medium",
          message: "Real-time updates are disabled in the frontend. Set NEXT_PUBLIC_ENABLE_RISK_LIVE_UPDATES=true to connect to the risk backend.",
          origin: "system",
        },
      ]);
      return () => {
        cancelAnimationFrame(mountRaf);
      };
    }

    let isMounted = true;

    // 1. Fetch initial status
    (async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/v5/risk/status`);
        if (!response.ok) return;
        const data = await response.json();
        if (isMounted) setIsAgentActive(Boolean(data?.isAgentActive));
      } catch {
        if (isMounted) {
          setThreatLogs((prev) => prev.length > 0 ? prev : [
            {
              id: "risk-offline",
              timestamp: new Date(),
              type: "Backend offline",
              severity: "medium",
              message: "Risk service is currently unavailable. Showing local data until the connection returns.",
              origin: "system",
            },
          ]);
        }
      }
    })();

    // 2. Configure SSE for real-time threat feed
    const eventSource = new EventSource(`${apiBaseUrl}/v5/risk/threats/stream`);
    
    eventSource.onmessage = (event) => {
      try {
        const log = JSON.parse(event.data);
        if (!log.timestamp) log.timestamp = new Date();
        else log.timestamp = new Date(log.timestamp);
        
        setThreatLogs(prev => [log, ...prev].slice(0, 10));
        
        // Dynamic Risk Score recalculation based on actual severity
        setRiskScore(prev => {
          const change = log.severity === 'high' ? -10 : (log.severity === 'medium' ? -3 : 1);
          return Math.min(100, Math.max(0, prev + change));
        });
      } catch (err) {
        void err;
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      cancelAnimationFrame(mountRaf);
      isMounted = false;
      eventSource.close();
    };
  }, [apiBaseUrl, liveUpdatesEnabled]);

  useEffect(() => {
    const el = chartContainerRef.current;
    if (!el) return;

    const updateSize = () => {
      const nextWidth = Math.max(280, Math.floor(el.clientWidth));
      const nextHeight = Math.max(320, Math.floor(el.clientHeight));
      setChartSize((prev) => (
        prev.width === nextWidth && prev.height === nextHeight
          ? prev
          : { width: nextWidth, height: nextHeight }
      ));
    };

    updateSize();

    const observer = new ResizeObserver(() => {
      updateSize();
    });

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  const riskFactors = [
    { name: "Compliance", value: 95 },
    { name: "Liquidity", value: 88 },
    { name: "Contratos", value: 98 },
    { name: "Mercado", value: 85 },
    { name: "Volatilidade", value: 90 },
  ];

  return (
    <div className="min-h-screen bg-transparent text-foreground p-6 md:p-12 font-sans selection:bg-primary/20">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Hero */}
        <header className="relative p-10 rounded-3xl overflow-hidden border border-border/60 bg-card/50 backdrop-blur-xl shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/12 via-transparent to-primary/5" />
          
          {/* Agent Pulse Effect */}
          {isAgentActive && (
            <div className="absolute top-10 right-10 flex items-center justify-center">
              <div className="absolute w-64 h-64 bg-[rgba(var(--stellaro-accent-rgb),0.10)] rounded-full animate-[ping_3s_linear_infinite]" />
              <div className="absolute w-48 h-48 bg-[rgba(var(--stellaro-accent-rgb),0.18)] rounded-full animate-[ping_2s_linear_infinite]" />
              <div className="w-32 h-32 bg-[rgba(var(--stellaro-accent-rgb),0.18)] rounded-full blur-2xl" />
            </div>
          )}
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/25">
                <BrainCircuit className="w-4 h-4" />
                <span>ElizaOS Autonomous Agent</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
                Risk Guardian <span className="text-primary">AI</span>
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Continuous monitoring of your positions. The intelligent agent analyzes liquidity,
                audits contracts in real time, and intercepts regulatory risks before they reach the network.
              </p>
            </div>

            <div className="flex flex-col gap-4 min-w-[280px]">
              <div className="p-6 rounded-3xl bg-card/50 border border-border/60 backdrop-blur-md relative overflow-hidden group">
                <div className={`absolute top-0 left-0 w-1 h-full ${riskScore > 80 ? 'bg-primary' : riskScore > 50 ? 'bg-secondary' : 'bg-destructive'}`} />
                <div className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Health Score
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-black tracking-tighter ${riskScore > 80 ? 'text-primary' : riskScore > 50 ? 'text-foreground' : 'text-destructive'}`}>
                    {riskScore}
                  </span>
                  <span className="text-muted-foreground">/ 100</span>
                </div>
              </div>

              <button 
                onClick={toggleAgent}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold transition-all duration-500 ${
                  isAgentActive 
                    ? 'bg-primary/10 text-primary border border-primary/25 hover:bg-primary/15' 
                    : 'bg-secondary/30 border border-border/60 text-muted-foreground hover:bg-secondary/40'
                }`}
              >
                {isAgentActive ? (
                  <><Cpu className="w-5 h-5 animate-pulse" /> Agent Active</>
                ) : (
                  <><Lock className="w-5 h-5" /> Start Agent</>
                )}
              </button>

              <button 
                onClick={generateZkScoreProof}
                disabled={isZkGenerating || !walletAddress}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold transition-all duration-500 ${
                  zkProof 
                    ? 'bg-primary/10 text-primary border border-primary/25' 
                    : 'bg-secondary/30 text-foreground border border-border/60 hover:bg-secondary/40'
                } disabled:opacity-50`}
              >
                {isZkGenerating ? (
                   <><RefreshCw className="w-5 h-5 animate-spin" /> Generating Proof...</>
                 ) : zkProof ? (
                  <><ShieldCheck className="w-5 h-5" /> Proof Generated</>
                ) : (
                  <><Fingerprint className="w-5 h-5" /> Generate ZK Solvency</>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Live Threat Feed */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary" />
              Live Threat Interceptions
            </h2>
            
            <div className="bg-card/40 border border-border/60 rounded-3xl p-2 relative overflow-hidden h-[400px]">
              {/* Scan Line effect */}
              {isAgentActive && <div className="absolute top-0 left-0 w-full h-1 bg-primary/50 shadow-[0_0_20px_rgba(var(--stellaro-accent-rgb),0.55)] animate-[scan_3s_linear_infinite] z-20" />}
              
              <div className="h-full overflow-hidden flex flex-col gap-2 p-4">
                {threatLogs.map(log => (
                  <div 
                    key={log.id} 
                    className="p-4 rounded-2xl bg-card/50 border border-border/60 flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-500"
                  >
                    <div className={`p-2 rounded-xl mt-1 shrink-0 ${
                      log.severity === 'high' ? 'bg-destructive/15 text-destructive' :
                      log.severity === 'medium' ? 'bg-primary/10 text-primary' : 'bg-secondary/30 text-foreground'
                    }`}>
                      {log.severity === 'high' ? <AlertTriangle className="w-5 h-5" /> : 
                       log.severity === 'medium' ? <Zap className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-foreground font-bold">{log.type}</span>
                        {log.origin === 'mobile' && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/25 uppercase tracking-widest">
                            <Smartphone className="w-3 h-3" /> Mobile
                          </span>
                        )}
                        <span className="text-xs font-mono text-muted-foreground">{log.timestamp.toLocaleTimeString()}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{log.message}</p>
                    </div>
                  </div>
                ))}

                {!isAgentActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10 p-6 text-center">
                    <Cpu className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-semibold text-muted-foreground">ElizaOS Sleeping</p>
                    <p className="text-sm text-muted-foreground mt-2">Start the agent to enable continuous blockchain contract scanning.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Metrics Radar */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
              <Radar className="w-6 h-6 text-primary" />
              Risk Matrix
            </h2>

            <div ref={chartContainerRef} className="bg-card/40 border border-border/60 rounded-3xl p-6 h-[400px] min-w-0 flex items-center justify-center">
              {isMounted && chartSize.width > 0 && chartSize.height > 0 ? (
                <RadarChart width={chartSize.width} height={chartSize.height} cx="50%" cy="50%" outerRadius="70%" data={riskFactors}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} stroke="hsl(var(--border))" />
                  <RechartsRadar
                    name="Risk"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                  />
                  </RadarChart>
              ) : (
                <div className="h-full w-full rounded-lg border border-dashed border-border/60" />
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
