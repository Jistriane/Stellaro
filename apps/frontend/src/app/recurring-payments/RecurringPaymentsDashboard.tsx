"use client";

import { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Activity,
  CreditCard,
  Calendar,
  PauseCircle,
  PlayCircle,
  XCircle,
  Zap,
} from "lucide-react";

type Subscription = {
  id: string;
  name: string;
  amount: number;
  currency: string;
  cadence: string;
  status: string;
  nextBilling: string;
};

type IncomingSubscription = Omit<Subscription, "amount"> & {
  amount: number | string | null;
};

function normalizeAmount(value: number | string | null): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export default function RecurringPaymentsDashboard({ initialSubscriptions }: { initialSubscriptions: IncomingSubscription[] }) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() =>
    initialSubscriptions.map((sub) => ({
      ...sub,
      amount: normalizeAmount(sub.amount),
    })),
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompliant, setIsCompliant] = useState(true); // Demo mock

  const toggleStatus = async (id: string, currentStatus: string) => {
    if (!isCompliant) {
      alert("Your compliance (SSI/KYC) has expired. Please update it to manage subscriptions.");
      return;
    }
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 1000));
    setSubscriptions(subs => subs.map(sub => {
      if (sub.id === id) {
        return { ...sub, status: currentStatus === "active" ? "paused" : "active" };
      }
      return sub;
    }));
    setIsProcessing(false);
  };

  const cancelSubscription = async (id: string) => {
    if(!confirm("Are you sure you want to cancel this subscription?")) return;
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 1500));
    setSubscriptions(subs => subs.filter(sub => sub.id !== id));
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-transparent text-foreground p-6 md:p-12 font-sans selection:bg-primary/20">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <header className="relative p-10 rounded-3xl overflow-hidden border border-border/60 bg-card/50 backdrop-blur-xl shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-[rgba(143,212,179,0.10)]" />
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary/15 rounded-full blur-[80px]" />
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
            <div className="space-y-4 max-w-xl">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                  <RefreshCw className="w-4 h-4" />
                  <span>On-chain Subscriptions</span>
                </div>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  isCompliant 
                    ? 'bg-primary/10 text-primary border-primary/20' 
                    : 'bg-destructive/10 text-destructive border-destructive/20'
                }`}>
                  {isCompliant ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                  <span>{isCompliant ? "SSI Active" : "Compliance Expired"}</span>
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
                Recurring Payments
              </h1>
                <p className="text-muted-foreground text-lg">
                Manage your active on-chain subscriptions. Your funds are debited automatically without having to sign manual transactions each cycle.
              </p>
            </div>

            <div className="flex flex-col justify-center gap-4 min-w-[240px]">
              <div className="p-5 rounded-2xl bg-secondary/20 border border-border/60 backdrop-blur-md">
                <div className="text-sm text-muted-foreground mb-1">Monthly Recurring Spend</div>
                <div className="text-3xl font-bold text-primary flex items-baseline gap-1">
                  <span className="text-lg">STLT</span>
                  {subscriptions.reduce((acc, sub) => sub.status === 'active' ? acc + sub.amount : acc, 0).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            Active Subscriptions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {subscriptions.map(sub => (
              <div 
                key={sub.id} 
                className={`relative group p-6 rounded-3xl border transition-all duration-300 ${
                  sub.status === 'active' 
                    ? 'bg-card/50 border-border/60 hover:border-primary/40 hover:shadow-[0_0_30px_-10px_rgba(212,168,106,0.12)]' 
                    : 'bg-card/30 border-border/40 opacity-80'
                }`}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl border ${sub.status === 'active' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-secondary/20 text-muted-foreground border-border/60'}`}>
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">{sub.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">{sub.cadence}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                    sub.status === 'active' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-secondary/20 text-muted-foreground border-border/60'
                  }`}>
                    {sub.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-secondary/20 p-3 rounded-xl border border-border/60">
                    <div className="text-xs text-muted-foreground mb-1">Debit Amount</div>
                    <div className="text-lg font-bold text-foreground">{sub.amount.toFixed(2)} {sub.currency}</div>
                  </div>
                  <div className="bg-secondary/20 p-3 rounded-xl border border-border/60">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <Calendar className="w-3.5 h-3.5" /> Next Billing
                    </div>
                    <div className="text-sm font-semibold text-foreground mt-1">{new Date(sub.nextBilling).toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
                  <button 
                    onClick={() => toggleStatus(sub.id, sub.status)}
                    disabled={isProcessing}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-secondary/40 text-foreground"
                  >
                    {sub.status === 'active' ? (
                      <><PauseCircle className="w-4 h-4" /> Pause</>
                    ) : (
                      <><PlayCircle className="w-4 h-4 text-primary" /> <span className="text-primary">Resume</span></>
                    )}
                  </button>
                  <button 
                    onClick={() => cancelSubscription(sub.id)}
                    disabled={isProcessing}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <XCircle className="w-4 h-4" /> Cancel
                  </button>
                </div>
              </div>
            ))}

            {subscriptions.length === 0 && (
              <div className="col-span-full py-16 flex flex-col items-center text-center bg-secondary/10 border border-border/60 rounded-3xl border-dashed">
                <Zap className="w-10 h-10 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No subscriptions</h3>
                <p className="text-muted-foreground max-w-md">You do not have any active recurring payments right now. Subscriptions created by dApps will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
