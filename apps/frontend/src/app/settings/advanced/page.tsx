"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { useWalletStore } from "@/state/wallet";

export default function SettingsAdvancedPage() {
  const t = useTranslations("settings");
  const connected = useWalletStore((s) => s.connected);
  const address = useWalletStore((s) => s.address);
  const network = useWalletStore((s) => s.network);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <Image src="/capa.png" alt="Stellaro background" fill priority sizes="100vw" className="object-cover object-center opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/85 to-background/60" />
      <div className="absolute inset-0 bg-[radial-gradient(1000px_circle_at_20%_15%,rgba(var(--stellaro-accent-rgb),0.14),transparent_60%),radial-gradient(900px_circle_at_80%_10%,rgba(197,135,230,0.10),transparent_55%)]" />
      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-8 p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">{t("title")}</h1>
            <p className="text-muted-foreground">Configurações avançadas (produção)</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Carteira</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="text-muted-foreground">
                Status: <span className="text-foreground">{connected ? "conectada" : "desconectada"}</span>
              </div>
              <div className="text-muted-foreground">
                Network: <span className="text-foreground">{network}</span>
              </div>
              <div className="text-muted-foreground">
                Address: <span className="text-foreground break-all">{address || "—"}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Chaves & Integrações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Para evitar dados simulados e qualquer exposição de secrets no frontend, a gestão de API keys e segredos não é exibida aqui.
                Integrações e credenciais devem ser configuradas no backend (env/Key Vault) e/ou via wallet (assinatura).
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
