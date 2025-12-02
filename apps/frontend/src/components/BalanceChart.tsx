"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

const sampleData = [
  { t: "T-5", v: 10.2 },
  { t: "T-4", v: 10.4 },
  { t: "T-3", v: 10.35 },
  { t: "T-2", v: 10.6 },
  { t: "T-1", v: 10.55 },
  { t: "T-0", v: 10.7 },
];

export default function BalanceChart() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Histórico de Saldo</CardTitle>
        <CardDescription>Evolução do saldo nos últimos períodos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sampleData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="t" stroke="currentColor" fontSize={12} />
              <YAxis stroke="currentColor" fontSize={12} domain={[10, 11]} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px'
                }}
                labelStyle={{ color: '#fff' }}
                itemStyle={{ color: '#fff' }}
              />
              <Line type="monotone" dataKey="v" stroke="#8b5cf6" strokeWidth={2} dot={true} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
