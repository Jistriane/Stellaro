"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getWalletBalances } from "@/lib/soroban";
import { useAppStore } from "@/store/app";
import { useTranslations } from "next-intl";
import WalletDebug from "@/components/WalletDebug";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";

export default function WalletPage() {
  const t = useTranslations("wallet");
  const { publicKey, loggedIn } = useAppStore((s) => s.auth);
  const balances = useAppStore((s) => s.balances);
  const setBalances = useAppStore((s) => s.setBalances);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Enable real-time updates when the wallet connects
  useRealTimeUpdates();

  useEffect(() => {
    let active = true;
    async function run() {
      if (!publicKey) return;
      setLoading(true);
      setError(undefined);
      const res = await getWalletBalances(publicKey);
      if (!active) return;
      setBalances({ xlm: res.xlm, stlt: res.stlt });
      setLoading(false);
    }
    run().catch(() => {
      if (!active) return;
      setError("failed_fetch");
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [publicKey, setBalances]);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <Image src="/capa.png" alt="Stellaro background" fill priority sizes="100vw" className="object-cover object-center opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/92 to-background/75" />
      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-8 p-6">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
      
      {/* Debug component for wallet detection */}
      <WalletDebug />
      
      <Card>
        <CardHeader>
          <CardTitle>{t("section_my_wallet")}</CardTitle>
        </CardHeader>
        <CardContent>
          {!loggedIn ? (
            <div className="text-muted-foreground">{t("login_to_view")}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">{t("public_key")}</div>
                <div className="truncate text-foreground">{publicKey}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">{t("xlm_balance")}</div>
                <div className="text-xl font-semibold">{loading ? "…" : balances.xlm ?? "0"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">{t("stlt_balance")}</div>
                <div className="text-xl font-semibold">{loading ? "…" : balances.stlt ?? "0"}</div>
              </div>
              {error && (
                <div className="col-span-full text-sm text-destructive">{t("error_balances")}</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
      </div>
  );
}
