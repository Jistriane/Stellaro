"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";

export default function RiskPage() {
  const t = useTranslations("risk");

  // Ativa atualizações em tempo real quando carteira conecta
  useRealTimeUpdates();

  return (
    <div className="space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-50">{t("header.title")}</h1>
        <p className="text-slate-400">{t("header.intro")}</p>
      </header>

      <Card className="border-slate-800 bg-slate-900/70">
        <CardHeader>
          <CardTitle className="text-lg text-slate-100">Monitoramento de risco ainda não conectado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-300">
          <p>Conecte os dados reais antes de disponibilizar esta tela.</p>
          <ul className="list-disc list-inside space-y-1 text-slate-400">
            <li>Retornar alertas atuais via `/api/risk/alerts` (Pix, login, transações atípicas).</li>
            <li>Trazer score e níveis de risco do usuário via `/api/risk/score`.</li>
            <li>Carregar limites configurados em `/api/risk/limits` e permitir atualização com `PATCH`.</li>
            <li>Registrar eventos recentes em `/api/risk/events` com ordenação e sem cache.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
