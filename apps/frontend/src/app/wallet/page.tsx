"use client";

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
  
  // Ativa atualizações em tempo real quando carteira conecta
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
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      
      {/* Debug component for wallet detection */}
      <WalletDebug />
      
      <Card>
        <CardHeader>
          <CardTitle>{t("section_my_wallet")}</CardTitle>
        </CardHeader>
        <CardContent>
          {!loggedIn ? (
            <div className="text-slate-400">{t("login_to_view")}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-slate-400">{t("public_key")}</div>
                <div className="truncate text-slate-200">{publicKey}</div>
              </div>
              <div>
                <div className="text-sm text-slate-400">{t("xlm_balance")}</div>
                <div className="text-xl font-semibold">{loading ? "…" : balances.xlm ?? "0"}</div>
              </div>
              <div>
                <div className="text-sm text-slate-400">{t("stlt_balance")}</div>
                <div className="text-xl font-semibold">{loading ? "…" : balances.stlt ?? "0"}</div>
              </div>
              {error && (
                <div className="col-span-full text-sm text-red-400">{t("error_balances")}</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
