"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";
import {
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Shield,
  Eye,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Activity,
  Zap,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface RiskEvent {
  id: number;
  type: "pix" | "login" | "trade" | "unusual";
  timestamp: string;
  description: string;
  severity: "low" | "medium" | "high";
  status: "new" | "reviewed" | "resolved";
}

interface RiskLimit {
  id: string;
  name: string;
  current: number;
  limit: number;
  unit: string;
  category: "pix" | "withdraw" | "trade";
}

export default function RiskPage() {
  const t = useTranslations("risk");
  const [riskScore, setRiskScore] = useState(35);
  const [events, setEvents] = useState<RiskEvent[]>([]);
  const [limits, setLimits] = useState<RiskLimit[]>([]);
  const [loading, setLoading] = useState(true);

  // Ativa atualizações em tempo real quando carteira conecta
  useRealTimeUpdates();

  useEffect(() => {
    // Mock data
    const mockEvents: RiskEvent[] = [
      {
        id: 1,
        type: "login",
        timestamp: "2025-12-09T14:32:00Z",
        description: "Login realizado a partir de novo dispositivo",
        severity: "high",
        status: "new",
      },
      {
        id: 2,
        type: "unusual",
        timestamp: "2025-12-09T12:15:00Z",
        description: "Padrão de transação incomum detectado",
        severity: "medium",
        status: "reviewed",
      },
      {
        id: 3,
        type: "pix",
        timestamp: "2025-12-09T10:45:00Z",
        description: "Transferência PIX de alto valor processada",
        severity: "medium",
        status: "resolved",
      },
      {
        id: 4,
        type: "trade",
        timestamp: "2025-12-08T16:20:00Z",
        description: "Grande ordem de trading executada",
        severity: "low",
        status: "resolved",
      },
    ];

    const mockLimits: RiskLimit[] = [
      {
        id: "pix_daily",
        name: t("limits.pix_daily"),
        current: 2500,
        limit: 5000,
        unit: "BRL",
        category: "pix",
      },
      {
        id: "withdraw_daily",
        name: t("limits.withdraw_daily"),
        current: 1200,
        limit: 10000,
        unit: "BRL",
        category: "withdraw",
      },
      {
        id: "trade_daily",
        name: t("limits.trade_daily"),
        current: 8500,
        limit: 50000,
        unit: "BRL",
        category: "trade",
      },
    ];

    setEvents(mockEvents);
    setLimits(mockLimits);
    setLoading(false);
  }, [t]);

  const getRiskLevel = () => {
    if (riskScore < 40) return { label: t("sidebar.level_low"), color: "text-slate-300", bgColor: "bg-slate-700/30" };
    if (riskScore < 70) return { label: t("sidebar.level_medium"), color: "text-slate-300", bgColor: "bg-slate-700/50" };
    return { label: t("sidebar.level_high"), color: "text-slate-200", bgColor: "bg-slate-600/40" };
  };


  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low":
        return "bg-slate-700/30 text-slate-300";
      case "medium":
        return "bg-slate-700/40 text-slate-200";
      case "high":
        return "bg-slate-600/50 text-slate-100";
      default:
        return "bg-slate-700/30 text-slate-400";
    }
  };


  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "low":
        return <AlertCircle className="w-4 h-4" />;
      case "medium":
        return <AlertTriangle className="w-4 h-4" />;
      case "high":
        return <Shield className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "login":
        return <Eye className="w-4 h-4" />;
      case "pix":
        return <ArrowUpRight className="w-4 h-4" />;
      case "trade":
        return <TrendingUp className="w-4 h-4" />;
      case "unusual":
        return <Zap className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const riskLevel = getRiskLevel();

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-slate-400">{t("empty")}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-50">{t("header.title")}</h1>
          <p className="text-slate-400 text-sm">{t("header.intro")}</p>
        </div>

        {/* Risk Score Card */}
        <Card className="border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-slate-50">
                <Shield className="w-5 h-5" />
                {t("sidebar.score")}
              </CardTitle>
              <span className={`text-sm px-3 py-1 rounded-full ${riskLevel.bgColor} ${riskLevel.color} font-semibold`}>
                {riskLevel.label}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-end gap-6">
              <div className="flex-1">
                <div className="text-5xl font-bold text-slate-50 mb-2">{riskScore}</div>
                <p className="text-slate-400 text-sm">Pontuação atual de risco</p>
              </div>
              <div className="w-32 h-32 rounded-full border-8 border-slate-800 flex items-center justify-center bg-slate-800/30 relative">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-50">{riskScore}%</div>
                  <div className="text-xs text-slate-400 mt-1">do limite</div>
                </div>
                <div
                  className={`absolute inset-0 rounded-full border-8 border-transparent border-t-8 border-r-8 ${
                    riskScore < 40 ? "border-t-slate-300 border-r-slate-300" : riskScore < 70 ? "border-t-slate-400 border-r-slate-400" : "border-t-slate-200 border-r-slate-200"
                  }`}
                  style={{ transform: `rotate(${(riskScore / 100) * 360}deg)` }}
                ></div>

              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Tendência</span>
                <span className="text-slate-50 font-semibold flex items-center gap-1">
                  <TrendingDown className="w-4 h-4 text-slate-400" />
                  Melhorando
                </span>
              </div>

              <Button className="w-full bg-slate-800 hover:bg-slate-700 text-slate-50">{t("sidebar.improve_btn")}</Button>
            </div>
          </CardContent>
        </Card>

        {/* Risk Limits */}
        <Card className="border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800/50">
          <CardHeader>
            <CardTitle className="text-slate-50">{t("limits.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {limits.map((limit) => {
              const percentage = (limit.current / limit.limit) * 100;
              const isWarning = percentage > 75;

              return (
                <div key={limit.id} className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-slate-50 font-medium">{limit.name}</p>
                      <p className="text-sm text-slate-400">
                        {limit.current.toLocaleString("pt-BR")} / {limit.limit.toLocaleString("pt-BR")} {limit.unit}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold ${isWarning ? "text-slate-200" : "text-slate-400"}`}>{percentage.toFixed(1)}%</span>

                  </div>
                  <Progress value={percentage} max={100} className="h-2 rounded-full" />
                  {isWarning && <p className="text-xs text-slate-300">Limite próximo do máximo</p>}

                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Alerts and Events */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Events */}
          <div className="lg:col-span-2">
            <Card className="border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-slate-50">{t("events.title")}</CardTitle>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-50">
                  {t("events.view_all")}
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {events.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">{t("alerts.none")}</p>
                ) : (
                  events.map((event) => (
                    <div key={event.id} className={`p-4 rounded-lg border border-slate-700 flex gap-4 ${getSeverityColor(event.severity)}`}>
                      <div className="flex-shrink-0 mt-0.5">{getSeverityIcon(event.severity)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-slate-50 flex items-center gap-2">
                            {getEventIcon(event.type)}
                            {event.description}
                          </p>
                          {event.status === "new" && <span className="text-xs bg-slate-600/40 text-slate-200 px-2 py-1 rounded whitespace-nowrap">Novo</span>}

                        </div>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(event.timestamp).toLocaleString("pt-BR")}
                        </p>
                      </div>
                      {event.status === "new" && (
                        <div className="flex-shrink-0 flex gap-1">
                          <Button size="sm" variant="ghost" className="h-8 text-xs text-slate-50 hover:bg-slate-700">
                            {t("alerts.dismiss")}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800/50">
            <CardHeader>
              <CardTitle className="text-slate-50">{t("quick.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full bg-slate-800 hover:bg-slate-700 text-slate-50 justify-start" variant="ghost">
                <Eye className="w-4 h-4 mr-2" />
                {t("quick.view_faq")}
              </Button>
              <Button className="w-full bg-slate-800 hover:bg-slate-700 text-slate-50 justify-start" variant="ghost">
                <AlertCircle className="w-4 h-4 mr-2" />
                {t("quick.contact_team")}
              </Button>
              <Button className="w-full bg-slate-700/40 hover:bg-slate-700/60 text-slate-200 justify-start" variant="ghost">
                <Shield className="w-4 h-4 mr-2" />
                {t("quick.block_now")}
              </Button>

            </CardContent>
          </Card>
        </div>

        {/* Education */}
        <Card className="border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800/50">
          <CardHeader>
            <CardTitle className="text-slate-50">{t("edu.title")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { q: t("edu.q1"), a: t("edu.q1_desc") },
              { q: t("edu.q2"), a: t("edu.q2_desc") },
              { q: t("edu.q3"), a: t("edu.q3_desc") },
            ].map((item, idx) => (
              <div key={idx} className="space-y-2 p-4 rounded-lg bg-slate-800/30 border border-slate-700 hover:border-slate-600 transition">
                <p className="text-sm font-semibold text-slate-50">{item.q}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Footer Warning */}
        <div className="p-4 rounded-lg bg-slate-700/30 border border-slate-600 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-slate-300 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-slate-300">{t("footer.warning")}</p>
        </div>

      </div>
    </div>
  );
}
