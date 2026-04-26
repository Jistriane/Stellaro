'use client';

import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart, Pie 
} from 'recharts';

const data = [
  { name: 'Jan', tvl: 4000, debt: 2400 },
  { name: 'Fev', tvl: 3000, debt: 1398 },
  { name: 'Mar', tvl: 2000, debt: 9800 },
  { name: 'Abr', tvl: 2780, debt: 3908 },
  { name: 'Mai', tvl: 1890, debt: 4800 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function AnalyticsDashboard() {
  return (
    <div className="p-8 bg-slate-900 min-h-screen text-white font-sans">
      <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
        DAO Analytics Hub
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {[
          { label: 'TVL Global', value: '$15.45M', trend: '+12%' },
          { label: 'Dívida Ativa', value: '$8.20M', trend: '-2%' },
          { label: 'Health Factor', value: '1.88', trend: 'Estável' },
          { label: 'Protocol Revenue', value: '$125K', trend: '+45%' },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-blue-500 transition-all shadow-xl">
            <p className="text-slate-400 text-sm mb-1">{stat.label}</p>
            <p className="text-3xl font-bold">{stat.value}</p>
            <p className={`text-xs mt-2 ${stat.trend.startsWith('+') ? 'text-emerald-400' : 'text-slate-400'}`}>
              {stat.trend} vs mês anterior
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico de Crescimento */}
        <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl">
          <h2 className="text-xl font-semibold mb-6">Crescimento TVL vs Dívida</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorTvl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="tvl" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTvl)" />
                <Area type="monotone" dataKey="debt" stroke="#ef4444" fillOpacity={0.3} fill="#ef4444" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribuição de RWAs */}
        <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl">
          <h2 className="text-xl font-semibold mb-6">Composição do Colateral RWA</h2>
          <div className="h-80 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Imóveis', value: 45 },
                    { name: 'Metais', value: 25 },
                    { name: 'Dívida Corp', value: 20 },
                    { name: 'Outros', value: 10 },
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
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
             {['Imóveis', 'Metais', 'Dívida Corp', 'Outros'].map((label, i) => (
               <div key={i} className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                 <span className="text-sm text-slate-400">{label}</span>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}
