"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";

export default function TradingPage() {
  const t = useTranslations('trading');
  
  // Enable real-time updates when the wallet connects
  useRealTimeUpdates();

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <Image src="/capa.png" alt="Stellaro background" fill priority sizes="100vw" className="object-cover object-center opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/92 to-background/75" />
      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-8 p-6">
      {/* Header and intro */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('header.title')}</h1>
        <div className="text-xs text-muted-foreground">{t('header.platform_normal')}</div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('intro.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('intro.p1')}</p>
          <div className="mt-3 rounded border border-border/60 bg-secondary/10 px-3 py-2 text-sm">
            Trading está desabilitado neste build para evitar dados simulados. Habilite apenas quando houver integração real (orderbook, trades e ordens) via backend.
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
