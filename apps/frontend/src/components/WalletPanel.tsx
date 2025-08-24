"use client";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useWalletStore } from "../state/wallet";
import type { WalletType } from "../lib/wallets/connectors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

export default function WalletPanel() {
  const t = useTranslations("wallet");
  const tLoginErr = useTranslations("login.errors");
  const { connected, address, balance, loading, error, available, activeType, connectByType, connectFreighter, disconnect, refreshBalance, refreshAvailable, network, invokeContract } = useWalletStore();
  const [selected, setSelected] = useState<string>("");
  const [testing, setTesting] = useState(false);
  const [mounted, setMounted] = useState(false);
  // Removido: detecção de MetaMask (EVM)

  // Traduz códigos de erro padronizados dos conectores (ERR_*) para i18n amigável
  const displayError = useMemo(() => {
    if (!error) return null;
    const msg = String(error);
    const upper = msg.toUpperCase();
    if (upper.includes("ERR_FREIGHTER_NOT_FOUND")) return tLoginErr("freighter_not_found");
    if (upper.includes("ERR_ALBEDO_NOT_FOUND")) return tLoginErr("albedo_not_found");
    if (upper.includes("ERR_RABET_NOT_FOUND")) return tLoginErr("rabet_not_found");
    if (upper.includes("ERR_XBULL_NOT_FOUND")) return tLoginErr("xbull_not_found");
    if (upper.includes("ERR_LEDGER_UNSUPPORTED")) return tLoginErr("ledger_unsupported");
    if (upper.includes("ERR_SOROBAN_NO_COMPAT")) return tLoginErr("soroban_no_compat");
    if (upper.includes("ERR_CHAINLINK_NOT_READY")) return tLoginErr("chainlink_not_ready");
    // Erros de Horizon/saldo
    if (msg.toLowerCase().includes("horizon")) return t("error_balances");
    // Genérico
    return tLoginErr("wallet_connect_fail");
  }, [error, t, tLoginErr]);

  const options = useMemo(() => {
    return available.map((w) => ({ ...w, disabled: !w.available }));
  }, [available]);

  const walletLabel = useMemo(() => {
    const map: Record<string, string> = {
      freighter: "Freighter",
      xbull: "xBull",
      albedo: "Albedo",
      rabet: "Rabet",
      ledger: "Ledger",
    };
    return activeType ? (map[activeType] ?? activeType) : "—";
  }, [activeType]);

  useEffect(() => {
    // Atualiza saldo periodicamente quando conectado
    if (!connected) return;
    const id = setInterval(() => {
      refreshBalance();
    }, 15000);
    return () => clearInterval(id);
  }, [connected, refreshBalance]);

  useEffect(() => {
    setMounted(true);
    // Recalcula carteiras disponíveis quando o componente monta
    refreshAvailable();
    // E sempre que a aba voltar a ficar visível (após instalar ou habilitar extensões)
    const onVis = () => {
      if (document.visibilityState === "visible") refreshAvailable();
    };
    const onFocus = () => refreshAvailable();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onFocus);
    // Removido: aviso sobre MetaMask
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onFocus);
    };
  }, [refreshAvailable]);

  // Removido: não auto-selecionar carteira. Usuário deve escolher explicitamente.

  async function onTestSoroban() {
    try {
      setTesting(true);
      const contractId = typeof window !== "undefined" ? window.prompt(t("prompt_contract_id")) : null;
      if (!contractId) return;
      const functionName = typeof window !== "undefined" ? window.prompt(t("prompt_function_name")) : null;
      if (!functionName) return;
      const res = await invokeContract({ contractId, functionName });
      if (typeof window !== "undefined") {
        window.alert(t("invoke_success"));
        console.log("Soroban invoke result:", res);
      }
    } catch (e: unknown) {
      if (typeof window !== "undefined") {
        const msg = e instanceof Error ? e.message : String(e);
        window.alert(t("invoke_error_prefix") + msg);
      }
    } finally {
      setTesting(false);
    }
  }

  return (
    <Card className="w-full max-w-xl border-slate-600/40 bg-white/50 dark:bg-slate-900/40 backdrop-blur shadow-md">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Stelato" width={42} height={42} className="rounded-md" />
            <div>
              <CardTitle className="text-slate-700 dark:text-foreground">{t("title")}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={connected ? "default" : "outline"}>{connected ? walletLabel : t("select_wallet")}</Badge>
                <Badge variant="outline">{network}</Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!connected && (
              mounted ? (
                <select
                  className="rounded-lg bg-slate-800 text-slate-100 border border-slate-600 px-3 py-2 text-sm"
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                  disabled={loading}
                >
                  <option value="" disabled>
                    {t("select_wallet")}
                  </option>
                  {options.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}{!opt.available ? ` (${t("not_detected")})` : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  className="rounded-lg bg-slate-800 text-slate-100 border border-slate-600 px-3 py-2 text-sm"
                  value=""
                  disabled
                >
                  <option value="">{t("detecting_wallets")}</option>
                </select>
              )
            )}
            {!connected && (
              <button
                type="button"
                onClick={refreshAvailable}
                className="rounded-full bg-slate-700 text-slate-100 hover:bg-slate-600 px-3 py-2 text-xs"
                title={t("recalc_title")}
              >
                {t("recheck")}
              </button>
            )}
            {/* Aviso MetaMask removido */}
            {connected ? (
              <button onClick={disconnect} className="rounded-full bg-primary text-slate-900 hover:bg-primary-600 px-4 py-2 text-sm font-medium">
                {t("disconnect")}
              </button>
            ) : (
              <button
                onClick={() => (selected === "freighter" ? connectFreighter() : connectByType(selected as WalletType))}
                className="rounded-full bg-primary text-slate-900 hover:bg-primary-600 px-4 py-2 text-sm font-medium"
                disabled={loading || !selected}
              >
                {loading
                  ? t("connecting")
                  : selected
                  ? t("connect_with", { name: options.find((o) => o.id === selected)?.name ?? t("wallet") })
                  : t("connect")}
              </button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {displayError && (
          <div className="mt-1 mb-2 text-sm text-red-600">{displayError}</div>
        )}

        {connected && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-slate-600/30 p-4">
              <div className="text-xs text-slate-500">{t("address")}</div>
              <div className="font-mono break-all text-sm mt-1">{address}</div>
            </div>
            <div className="rounded-lg border border-slate-600/30 p-4">
              <div className="text-xs text-slate-500">{t("xlm_balance_horizon")}</div>
              <div className="text-lg font-semibold mt-1">{balance ?? "—"}</div>
            </div>
            <div className="sm:col-span-2 flex items-center justify-end">
              <button
                onClick={onTestSoroban}
                className="rounded-full bg-emerald-500 text-slate-900 hover:bg-emerald-600 px-4 py-2 text-sm font-medium"
                disabled={testing}
              >
                {testing ? t("testing") : t("test_soroban")}
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
