"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type ChainConfig = {
  network?: string;
  rpcUrl?: string;
  passphrase?: string;
  contracts?: Record<string, string | undefined>;
};

export default function BridgePage() {
  const t = useTranslations("bridge");
  const [config, setConfig] = useState<ChainConfig | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`${apiUrl}/chain/config`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as ChainConfig;
        if (!active) return;
        setConfig(data);
      } catch {
        if (!active) return;
        setConfig(null);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const bridgeAdapter = config?.contracts?.BRIDGE_ADAPTER_ID || config?.contracts?.bridgeAdapterId || "";

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <Image src="/capa.png" alt="Stellaro background" fill priority sizes="100vw" className="object-cover object-center opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/92 to-background/75" />
      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-8 p-6">
        <div className="max-w-5xl mx-auto space-y-8">
          <div>
            <h1 className="text-2xl font-semibold mb-1">{t("title")}</h1>
            <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Bridge</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Para evitar dados simulados, a interface de bridge fica indisponível até existir um adaptador on-chain e um relayer de produção.
              </div>
              <div className="text-xs text-muted-foreground">
                Network: <span className="text-foreground">{config?.network || "—"}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                RPC: <span className="text-foreground">{config?.rpcUrl || "—"}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                BRIDGE_ADAPTER_ID: <span className="text-foreground break-all">{bridgeAdapter || "—"}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
