"use client";

import Image from "next/image";
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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

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
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <Image src="/capa.png" alt="Stellaro background" fill priority sizes="100vw" className="object-cover object-center opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/92 to-background/75" />
      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-8 p-6">
        <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">{t("analysis.title")}</h1>
          <p className="text-muted-foreground text-sm">{t("analysis.subtitle")}</p>
        </div>

        {/* Alerts */}
        {analysis.alerts.map((alert: Record<string, string>, idx: number) => (
          <div key={idx} className="bg-secondary/20 border border-border/60 p-4 rounded-lg text-foreground">
            {alert.title}: {alert.message}
          </div>
        ))}

        {/* Main KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border/60 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Credit Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{analysis.creditScore}</div>
              <Badge className="mt-2" variant="outline">
                {analysis.scoreRange}
              </Badge>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Risk Level</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-primary" />
                <span className="text-2xl font-bold text-primary">
                  {analysis.riskLevel}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {analysis.riskPercent}% estimated risk
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Collateral Ratio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{analysis.collateralRatio}%</div>
              <p className="text-xs text-primary mt-2">
                Required: {analysis.minRequired}%
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                Liquidation Price
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                ${analysis.liquidationPrice.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Current: ${analysis.currentPrice.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Risk Factors Radar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border/60 bg-card/50">
            <CardHeader>
              <CardTitle className="text-foreground">Risk Factors Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              {isMounted ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={analysis.factors}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <PolarRadiusAxis stroke="hsl(var(--muted-foreground))" />
                  <Radar
                    name="Score"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.6}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(10, 12, 16, 0.85)",
                      border: "1px solid rgba(244, 236, 220, 0.10)",
                      borderRadius: 14,
                      color: "rgb(244, 236, 220)",
                      backdropFilter: "blur(12px)",
                    }}
                  />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] rounded-lg border border-dashed border-border/60" />
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/50">
            <CardHeader>
              <CardTitle className="text-foreground">Risk Metrics Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Portfolio Health</span>
                  <span className="font-bold">95%</span>
                </div>
                <div className="w-full bg-secondary/40 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full w-11/12" />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Volatility Risk</span>
                  <span className="font-bold">25%</span>
                </div>
                <div className="w-full bg-secondary/40 rounded-full h-2">
                  <div className="bg-primary/60 h-2 rounded-full w-1/4" />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    Liquidation Risk
                  </span>
                  <span className="font-bold">5%</span>
                </div>
                <div className="w-full bg-secondary/40 rounded-full h-2">
                  <div className="bg-destructive h-2 rounded-full w-1/20" />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Market Risk</span>
                  <span className="font-bold">35%</span>
                </div>
                <div className="w-full bg-secondary/40 rounded-full h-2">
                  <div className="bg-primary/60 h-2 rounded-full w-1/3" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recommendations */}
        <Card className="border-border/60 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <TrendingDown className="w-5 h-5" />
              Risk Management Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.recommendations.map((rec: string, idx: number) => (
                <div key={idx} className="flex gap-3 items-start">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{rec}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Historical Risk */}
        <Card className="border-border/60 bg-card/50">
          <CardHeader>
            <CardTitle className="text-foreground">Risk Score History</CardTitle>
          </CardHeader>
          <CardContent>
            {isMounted ? (
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
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(10, 12, 16, 0.85)",
                    border: "1px solid rgba(244, 236, 220, 0.10)",
                    borderRadius: 14,
                    color: "rgb(244, 236, 220)",
                    backdropFilter: "blur(12px)",
                  }}
                />
                <Bar dataKey="score" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] rounded-lg border border-dashed border-border/60" />
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
