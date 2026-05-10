"use client";

import { useState, useEffect } from "react";
import { Shield, BrainCircuit, Activity, AlertTriangle, ShieldCheck, Cpu, Radar, Zap, Lock, Smartphone } from "lucide-react";
import { RadarChart, Radar as RechartsRadar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

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
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const liveUpdatesEnabled = process.env.NEXT_PUBLIC_ENABLE_RISK_LIVE_UPDATES === "true";

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
    setIsMounted(true);

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
      return;
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
      isMounted = false;
      eventSource.close();
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
    <div className="min-h-screen bg-[#020617] text-slate-200 p-6 md:p-12 font-sans selection:bg-rose-500/30">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Hero */}
        <header className="relative p-10 rounded-3xl overflow-hidden border border-slate-800/60 bg-slate-900/40 backdrop-blur-xl shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-transparent to-orange-500/5" />
          
          {/* Agent Pulse Effect */}
          {isAgentActive && (
            <div className="absolute top-10 right-10 flex items-center justify-center">
              <div className="absolute w-64 h-64 bg-rose-500/10 rounded-full animate-[ping_3s_linear_infinite]" />
              <div className="absolute w-48 h-48 bg-rose-500/20 rounded-full animate-[ping_2s_linear_infinite]" />
              <div className="w-32 h-32 bg-rose-500/20 rounded-full blur-2xl" />
            </div>
          )}
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 text-rose-400 text-sm font-medium border border-rose-500/20">
                <BrainCircuit className="w-4 h-4" />
                <span>ElizaOS Autonomous Agent</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                Risk Guardian <span className="text-rose-500">AI</span>
              </h1>
              <p className="text-slate-400 text-lg leading-relaxed">
                Continuous monitoring of your positions. The intelligent agent analyzes liquidity,
                audits contracts in real time, and intercepts regulatory risks before they reach the network.
              </p>
            </div>

            <div className="flex flex-col gap-4 min-w-[280px]">
              <div className="p-6 rounded-3xl bg-slate-950/60 border border-slate-800 backdrop-blur-md relative overflow-hidden group">
                <div className={`absolute top-0 left-0 w-1 h-full ${riskScore > 80 ? 'bg-emerald-500' : riskScore > 50 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                <div className="text-sm text-slate-500 mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Health Score
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-4xl font-black tracking-tighter ${riskScore > 80 ? 'text-emerald-400' : riskScore > 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {riskScore}
                  </span>
                  <span className="text-slate-500">/ 100</span>
                </div>
              </div>

              <button 
                onClick={toggleAgent}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold transition-all duration-500 ${
                  isAgentActive 
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20' 
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {isAgentActive ? (
                  <><Cpu className="w-5 h-5 animate-pulse" /> Agent Active</>
                ) : (
                  <><Lock className="w-5 h-5" /> Start Agent</>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Live Threat Feed */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
              <Activity className="w-6 h-6 text-rose-500" />
              Live Threat Interceptions
            </h2>
            
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-2 relative overflow-hidden h-[400px]">
              {/* Scan Line effect */}
              {isAgentActive && <div className="absolute top-0 left-0 w-full h-1 bg-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.8)] animate-[scan_3s_linear_infinite] z-20" />}
              
              <div className="h-full overflow-hidden flex flex-col gap-2 p-4">
                {threatLogs.map(log => (
                  <div 
                    key={log.id} 
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-500"
                  >
                    <div className={`p-2 rounded-xl mt-1 shrink-0 ${
                      log.severity === 'high' ? 'bg-rose-500/20 text-rose-400' :
                      log.severity === 'medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {log.severity === 'high' ? <AlertTriangle className="w-5 h-5" /> : 
                       log.severity === 'medium' ? <Zap className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-bold">{log.type}</span>
                        {log.origin === 'mobile' && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold border border-blue-500/20 uppercase tracking-widest">
                            <Smartphone className="w-3 h-3" /> Mobile
                          </span>
                        )}
                        <span className="text-xs font-mono text-slate-500">{log.timestamp.toLocaleTimeString()}</span>
                      </div>
                      <p className="text-sm text-slate-400">{log.message}</p>
                    </div>
                  </div>
                ))}

                {!isAgentActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm z-10 p-6 text-center">
                    <Cpu className="w-12 h-12 text-slate-700 mb-4" />
                    <p className="text-lg font-semibold text-slate-400">ElizaOS Sleeping</p>
                    <p className="text-sm text-slate-500 mt-2">Start the agent to enable continuous blockchain contract scanning.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Metrics Radar */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
              <Radar className="w-6 h-6 text-rose-500" />
              Risk Matrix
            </h2>

            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 h-[400px] min-w-0 flex items-center justify-center">
              {isMounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={riskFactors}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} stroke="#334155" />
                  <RechartsRadar
                    name="Risk"
                    dataKey="value"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    fill="#f43f5e"
                    fillOpacity={0.3}
                  />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full rounded-lg border border-dashed border-slate-700/60" />
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
