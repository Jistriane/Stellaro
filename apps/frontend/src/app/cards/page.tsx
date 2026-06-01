"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function CardsPage() {
  const t = useTranslations("cards");

  // Enable real-time updates when the wallet connects
  useRealTimeUpdates();

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{
    enabled: boolean;
    mode: string;
    apiKeyConfigured: boolean;
    apiUrlConfigured: boolean;
    fallbackActive: boolean;
    fallbackReason: string | null;
  } | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch(`${apiUrl}/payments/card/status`, { cache: "no-store" });
        if (!active) return;
        if (res.ok) {
          setStatus((await res.json()) as any);
        } else {
          setStatus(null);
        }
      } catch {
        if (!active) return;
        setStatus(null);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("header.title")}</h1>
        <div className="text-xs text-muted-foreground">{t("header.subtitle")}</div>
      </div>

      {/* Integration status */}
      <Card>
        <CardHeader>
          <CardTitle>{t("summary.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : !status ? (
            <div className="text-sm text-muted-foreground">Indisponível: não foi possível consultar o backend.</div>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 rounded bg-secondary/30 border border-border/60">
                  mode: <b>{status.mode}</b>
                </span>
                <span className="px-2 py-1 rounded bg-secondary/30 border border-border/60">
                  apiKey: <b>{String(status.apiKeyConfigured)}</b>
                </span>
                <span className="px-2 py-1 rounded bg-secondary/30 border border-border/60">
                  apiUrl: <b>{String(status.apiUrlConfigured)}</b>
                </span>
              </div>
              {status.fallbackActive && (
                <div className="text-xs text-muted-foreground">
                  {status.fallbackReason ?? "Integração não configurada."}
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                Para tokenização/cobrança, é necessário fluxo autenticado e integração do provedor.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings & security */}
      <Card>
        <CardHeader>
          <CardTitle>{t("settings.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex flex-wrap gap-2">
            <Link href="/settings" className="px-3 py-2 rounded bg-secondary/30 border border-border/60 text-foreground">{t("settings.notifications")}</Link>
          </div>
          <div className="text-xs text-primary">
            {t("settings.tip")}
          </div>
          <div>
            <Link href="/docs" className="underline text-primary">{t("settings.docs_link")}</Link>
          </div>
        </CardContent>
      </Card>

      {/* Physical card delivery status */}
      <Card>
        <CardHeader>
          <CardTitle>{t("delivery.title")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div>{t("delivery.steps")}</div>
          <div className="text-xs text-muted-foreground">{t("delivery.tracking")}</div>
        </CardContent>
      </Card>

      {/* Help & FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>{t("help.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 text-sm">
            <Link href="/docs" className="px-3 py-2 rounded bg-secondary/30 border border-border/60">{t("help.how_to_use")}</Link>
            <Link href="/help" className="px-3 py-2 rounded bg-secondary/30 border border-border/60">{t("help.dispute")}</Link>
            <Link href="/help" className="px-3 py-2 rounded bg-secondary/30 border border-border/60">{t("help.quick_support")}</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
