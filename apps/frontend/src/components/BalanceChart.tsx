"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

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
    <div className="w-full h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={sampleData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="t" stroke="currentColor" fontSize={12} />
          <YAxis stroke="currentColor" fontSize={12} domain={[10, 11]} />
          <Tooltip />
          <Line type="monotone" dataKey="v" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
