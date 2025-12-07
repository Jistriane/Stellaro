"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, TrendingDown } from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function RiskAnalysisPage() {
  const t = useTranslations("risk");
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mockAnalysis = {
      creditScore: 720,
      scoreRange: "Good",
      riskLevel: "Low",
      riskPercent: 15,
      liquidationPrice: 1.2,
      currentPrice: 2.5,
      collateralRatio: 208,
      minRequired: 120,
      factors: [
        { name: "Credit Score", value: 85 },
        { name: "Collateral", value: 95 },
        { name: "Payment History", value: 90 },
        { name: "Account Age", value: 75 },
        { name: "Transaction Volume", value: 70 },
      ],
      alerts: [
        {
          type: "info",
          title: "Opportunity",
          message: "XLM price increased 5% - consider taking profit",
        },
      ],
      recommendations: [
        "Maintain collateral ratio above 150% for safety margin",
        "Consider diversifying into USDC for stablecoin exposure",
        "Set up liquidation alerts at 130% ratio",
      ],
    };

    setAnalysis(mockAnalysis);
    setLoading(false);
  }, []);

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">{t("analysis.title")}</h1>
          <p className="text-gray-400">{t("analysis.subtitle")}</p>
        </div>

        {/* Alerts */}
        {analysis.alerts.map((alert: Record<string, string>, idx: number) => (
          <div key={idx} className="bg-blue-900 border border-blue-700 p-4 rounded-lg text-blue-100">
            {alert.title}: {alert.message}
          </div>
        ))}

        {/* Main KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">Credit Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analysis.creditScore}</div>
              <Badge className="mt-2" variant="outline">
                {analysis.scoreRange}
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">Risk Level</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-400" />
                <span className="text-2xl font-bold text-green-400">
                  {analysis.riskLevel}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {analysis.riskPercent}% estimated risk
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">
                Collateral Ratio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analysis.collateralRatio}%</div>
              <p className="text-xs text-green-400 mt-2">
                Required: {analysis.minRequired}%
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">
                Liquidation Price
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ${analysis.liquidationPrice.toFixed(2)}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Current: ${analysis.currentPrice.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Risk Factors Radar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle>Risk Factors Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={analysis.factors}>
                  <PolarGrid stroke="#475569" />
                  <PolarAngleAxis dataKey="name" stroke="#94a3b8" />
                  <PolarRadiusAxis stroke="#94a3b8" />
                  <Radar
                    name="Score"
                    dataKey="value"
                    stroke="#0088FE"
                    fill="#0088FE"
                    fillOpacity={0.6}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #475569",
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle>Risk Metrics Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-400">Portfolio Health</span>
                  <span className="font-bold">95%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full w-11/12" />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-400">Volatility Risk</span>
                  <span className="font-bold">25%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full w-1/4" />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-400">
                    Liquidation Risk
                  </span>
                  <span className="font-bold">5%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full w-1/20" />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-400">Market Risk</span>
                  <span className="font-bold">35%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full w-1/3" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recommendations */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5" />
              Risk Management Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.recommendations.map((rec: string, idx: number) => (
                <div key={idx} className="flex gap-3 items-start">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">{rec}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Historical Risk */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle>Risk Score History</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={[
                  { date: "1 Dec", score: 680 },
                  { date: "8 Dec", score: 700 },
                  { date: "15 Dec", score: 710 },
                  { date: "22 Dec", score: 720 },
                  { date: "29 Dec", score: 720 },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #475569",
                  }}
                />
                <Bar dataKey="score" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
