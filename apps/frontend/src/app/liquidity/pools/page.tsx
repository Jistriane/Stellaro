"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { Droplet, Plus } from "lucide-react";

export default function LiquidityPoolsPage() {
  const t = useTranslations("liquidity");
  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <Image src="/capa.png" alt="Stellaro background" fill priority sizes="100vw" className="object-cover object-center opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/85 to-background/60" />
      <div className="absolute inset-0 bg-[radial-gradient(1000px_circle_at_20%_15%,rgba(var(--stellaro-accent-rgb),0.14),transparent_60%),radial-gradient(900px_circle_at_80%_10%,rgba(197,135,230,0.10),transparent_55%)]" />
      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-8 p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold mb-1">{t("pools.title")}</h1>
            <p className="text-xs text-muted-foreground">{t("pools.subtitle")}</p>
          </div>
          <Button disabled size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 opacity-60">
            <Plus className="w-4 h-4 mr-2" />
            Add Liquidity
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplet className="w-5 h-5 text-primary" />
              Pools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Para evitar dados simulados, esta tela depende de indexação on-chain (DEX/AMM) e de endpoints de listagem no backend.
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <Link href="/liquidity/manage" className="px-3 py-2 rounded bg-secondary/30 border border-border/60 text-foreground">
                Gerenciar liquidez
              </Link>
              <Link href="/docs" className="px-3 py-2 rounded bg-secondary/30 border border-border/60 text-foreground">
                Docs
              </Link>
            </div>
          </CardContent>
        </Card>
    </div>
      </div>
  );
}
