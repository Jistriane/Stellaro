"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";

export default function GovernanceVotePage() {
  const t = useTranslations("governance.vote");

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <Image src="/capa.png" alt="Stellaro background" fill priority sizes="100vw" className="object-cover object-center opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/85 to-background/60" />
      <div className="absolute inset-0 bg-[radial-gradient(1000px_circle_at_20%_15%,rgba(var(--stellaro-accent-rgb),0.14),transparent_60%),radial-gradient(900px_circle_at_80%_10%,rgba(197,135,230,0.10),transparent_55%)]" />
      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-8 p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h1 className="text-2xl font-semibold mb-1">{t("title")}</h1>
            <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">{t("title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded border border-border/60 bg-secondary/10 px-3 py-2 text-sm text-muted-foreground">
                Voting está desabilitado neste build para evitar votos simulados. Use a página de Governance para consultar propostas on-chain.
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                <Link href="/governance" className="px-3 py-2 rounded bg-secondary/30 border border-border/60 text-foreground">
                  Ver propostas
                </Link>
                <Link href="/docs" className="px-3 py-2 rounded bg-secondary/30 border border-border/60 text-foreground">
                  Docs
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
