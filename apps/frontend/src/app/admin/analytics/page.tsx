'use client';

import Image from "next/image";
import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie 
} from 'recharts';

const data = [
  { name: 'Jan', tvl: 4000, debt: 2400 },
  { name: 'Fev', tvl: 3000, debt: 1398 },
  { name: 'Mar', tvl: 2000, debt: 9800 },
  { name: 'Abr', tvl: 2780, debt: 3908 },
  { name: 'Mai', tvl: 1890, debt: 4800 },
];

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--secondary))",
  "hsl(var(--muted-foreground))",
];

export default function AnalyticsDashboard() {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <Image src="/capa.png" alt="Stellaro background" fill priority sizes="100vw" className="object-cover object-center opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/85 to-background/60" />
      <div className="absolute inset-0 bg-[radial-gradient(1000px_circle_at_20%_15%,rgba(var(--stellaro-accent-rgb),0.14),transparent_60%),radial-gradient(900px_circle_at_80%_10%,rgba(197,135,230,0.10),transparent_55%)]" />
      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-8 p-6">
        <div className="p-8 min-h-screen text-foreground font-sans">
      <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
        DAO Analytics Hub
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {[
          { label: 'TVL Global', value: '$15.45M', trend: '+12%' },
          { label: 'Active Debt', value: '$8.20M', trend: '-2%' },
          { label: 'Health Factor', value: '1.88', trend: 'Stable' },
          { label: 'Protocol Revenue', value: '$125K', trend: '+45%' },
        ].map((stat, i) => (
          <div key={i} className="bg-card/50 p-6 rounded-2xl border border-border/60 hover:border-primary/40 transition-all shadow-xl">
            <p className="text-muted-foreground text-sm mb-1">{stat.label}</p>
            <p className="text-3xl font-bold">{stat.value}</p>
            <p className={`text-xs mt-2 ${stat.trend.startsWith('+') ? 'text-primary' : 'text-muted-foreground'}`}>
              {stat.trend} vs previous month
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Growth chart */}
        <div className="bg-card/50 p-8 rounded-3xl border border-border/60 shadow-2xl">
          <h2 className="text-xl font-semibold mb-6">TVL vs Debt Growth</h2>
          <div className="h-80 w-full">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorTvl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.7}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "rgba(10, 12, 16, 0.85)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    borderRadius: "12px",
                    backdropFilter: "blur(12px)",
                  }}
                  itemStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Area type="monotone" dataKey="tvl" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorTvl)" />
                <Area type="monotone" dataKey="debt" stroke="hsl(var(--destructive))" fillOpacity={0.25} fill="hsl(var(--destructive))" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full rounded-lg border border-dashed border-border/60" />
            )}
          </div>
        </div>

        {/* RWA distribution */}
        <div className="bg-card/50 p-8 rounded-3xl border border-border/60 shadow-2xl">
          <h2 className="text-xl font-semibold mb-6">RWA Collateral Composition</h2>
          <div className="h-80 w-full flex items-center justify-center">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                <Pie
                  data={[
                    { name: 'Real Estate', value: 45 },
                    { name: 'Metals', value: 25 },
                    { name: 'Corp Debt', value: 20 },
                    { name: 'Other', value: 10 },
                  ]}
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(10, 12, 16, 0.85)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    borderRadius: "12px",
                    backdropFilter: "blur(12px)",
                  }}
                />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full rounded-lg border border-dashed border-border/60" />
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
             {['Real Estate', 'Metals', 'Corp Debt', 'Other'].map((label, i) => (
               <div key={i} className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                 <span className="text-sm text-muted-foreground">{label}</span>
               </div>
             ))}
          </div>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
}
