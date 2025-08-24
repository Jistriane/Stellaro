"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppStore } from "@/store/app";
import { getWalletBalances } from "@/lib/soroban";
import { useTranslations } from "next-intl";
import { useWalletStore } from "@/state/wallet";

type FreighterApi = {
  getPublicKey(): Promise<string>;
  signMessage(message: string): Promise<string>;
};

export default function LoginPage() {
  const t = useTranslations("login.login");
  const [email, setEmail] = useState("");
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingPasskey, setLoadingPasskey] = useState(false);
  const [loadingPasskeyReg, setLoadingPasskeyReg] = useState(false);
  const [loadingWallet, setLoadingWallet] = useState<null | "freighter" | "albedo" | "ledger">(null);
  const [freighterAvailable, setFreighterAvailable] = useState(false);
  const [albedoAvailable, setAlbedoAvailable] = useState(false);
  const [error, setError] = useState<string>("");
  const setLoggedIn = useAppStore((s) => s.setLoggedIn);
  const setBalances = useAppStore((s) => s.setBalances);
  const pushEvent = useAppStore((s) => s.pushEvent);
  const walletAvailable = useWalletStore((s) => s.available);
  const refreshWalletAvailable = useWalletStore((s) => s.refreshAvailable);
  const tLoginErrors = useTranslations("login.login.errors");

  const apiUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL, []);

  const displayError = useMemo(() => {
    if (!error) return null;
    const msg = String(error);
    const upper = msg.toUpperCase();
    if (upper.includes("ERR_FREIGHTER_NOT_FOUND")) return tLoginErrors("freighter_not_found");
    if (upper.includes("ERR_ALBEDO_NOT_FOUND")) return tLoginErrors("albedo_not_found");
    if (upper.includes("ERR_RABET_NOT_FOUND")) return tLoginErrors("rabet_not_found");
    if (upper.includes("ERR_XBULL_NOT_FOUND")) return tLoginErrors("xbull_not_found");
    if (upper.includes("ERR_LEDGER_UNSUPPORTED")) return tLoginErrors("ledger_unsupported");
    if (upper.includes("ERR_SOROBAN_NO_COMPAT")) return tLoginErrors("soroban_no_compat");
    if (upper.includes("ERR_CHAINLINK_NOT_READY")) return tLoginErrors("chainlink_not_ready");
    // Fallback para a própria mensagem se não for um código de erro conhecido
    // Isso mantém as mensagens de erro de passkey/email que já são i18n
    return msg;
  }, [error, tLoginErrors]);

  useEffect(() => {
    // Integra detecção global de carteiras
    refreshWalletAvailable();
  }, [refreshWalletAvailable]);

  useEffect(() => {
    // Reflete disponibilidade das carteiras do store atualizado
    const foundF = walletAvailable.find((w) => w.id === "freighter");
    if (foundF) {
      const isAvailable = Boolean(foundF.available);
      setFreighterAvailable(isAvailable);
      if (typeof console !== 'undefined') console.debug('[login] Freighter availability from store:', isAvailable);
    }
    const foundA = walletAvailable.find((w) => w.id === "albedo");
    if (foundA) {
      const isAvailable = Boolean(foundA.available);
      setAlbedoAvailable(isAvailable);
      if (typeof console !== 'undefined') console.debug('[login] Albedo availability from store:', isAvailable);
    }
  }, [walletAvailable]);

  // Detecção de Freighter agora é feita inteiramente pelo wallet store
  // O useEffect acima já sincroniza o estado local com o store

  // Detecção de Albedo agora é feita inteiramente pelo wallet store
  // O useEffect acima já sincroniza o estado local com o store

  function base64urlToArrayBuffer(base64url: string): ArrayBuffer {
    const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
    const pad = "=".repeat((4 - (base64.length % 4)) % 4);
    const str = atob(base64 + pad);
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
    return bytes.buffer;
  }

  function arrayBufferToBase64url(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const base64 = btoa(binary);
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  const onRegisterPasskey = useCallback(async () => {
    setError("");
    setLoadingPasskeyReg(true);
    try {
      // Verifica compatibilidade do WebAuthn
      if (!navigator.credentials || !window.PublicKeyCredential) {
        setError("WebAuthn não é suportado neste navegador.");
        return;
      }

      if (!apiUrl) {
        setError(t("errors.need_api"));
        return;
      }
      if (!email.trim()) {
        setError(t("errors.need_email_register"));
        return;
      }

      console.log("[passkey] Starting registration for email:", email);
      // 1) Inicia registro no backend
      console.log("[passkey] Calling register init endpoint:", `${apiUrl}/auth/passkey/register/init`);
      const initRes = await fetch(`${apiUrl}/auth/passkey/register/init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId: email, email }),
      });
      console.log("[passkey] Register init response status:", initRes.status);
      if (!initRes.ok) {
        const errorText = await initRes.text();
        console.error("[passkey] Register init failed:", errorText);
        throw new Error(t("errors.passkey_register_init_fail"));
      }
      const initJson: { challenge: string; rpId?: string; user?: { id: string; name?: string } } = await initRes.json();

      const publicKey: PublicKeyCredentialCreationOptions = {
        challenge: base64urlToArrayBuffer(initJson.challenge),
        rp: { name: "Stelato", id: initJson.rpId ?? window.location.hostname },
        user: {
          id: new TextEncoder().encode(email),
          name: email,
          displayName: email,
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 }, // ES256
        ],
        timeout: 60_000,
        attestation: "none",
      };

      const cred = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential | null;

      if (!cred) throw new Error(t("passkey_credential_create_fail"));

      const resp = cred.response as AuthenticatorAttestationResponse;
      const credential = {
        id: cred.id,
        rawId: arrayBufferToBase64url(cred.rawId),
        type: cred.type,
        response: {
          clientDataJSON: arrayBufferToBase64url(resp.clientDataJSON),
          attestationObject: arrayBufferToBase64url(resp.attestationObject),
        },
      };

      // 2) Verifica/encerra registro no backend
      const verifyRes = await fetch(`${apiUrl}/auth/passkey/register/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ challenge: initJson.challenge, credential }),
      });
      if (!verifyRes.ok) throw new Error(t("errors.passkey_register_verify_fail"));

      // 3) Sinaliza sucesso (pode manter o usuário logado se backend setar cookie)
      setLoggedIn(true, undefined);
      pushEvent("LOGGED_IN");
    } catch (e: unknown) {
      const maybeMsg = e && typeof e === "object" && "message" in e ? (e as { message?: unknown }).message : undefined;
      const msg = typeof maybeMsg === "string" && maybeMsg.length > 0 ? maybeMsg : t("errors.passkey_register_verify_fail");
      setError(msg);
    } finally {
      setLoadingPasskeyReg(false);
    }
  }, [apiUrl, email, pushEvent, setLoggedIn, t]);

  const onPasskey = useCallback(async () => {
    setError("");
    setLoadingPasskey(true);
    try {
      // Verifica compatibilidade do WebAuthn
      if (!navigator.credentials || !window.PublicKeyCredential) {
        setError("WebAuthn não é suportado neste navegador.");
        return;
      }

      if (!apiUrl) {
        setError(t("errors.need_api"));
        return;
      }
      if (!email.trim()) {
        setError(t("errors.need_email_login"));
        return;
      }

      console.log("[passkey] Starting login for email:", email);
      // 1) Inicia desafio de login WebAuthn no backend
      console.log("[passkey] Calling login init endpoint:", `${apiUrl}/auth/passkey/login/init`);
      const initRes = await fetch(`${apiUrl}/auth/passkey/login/init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      console.log("[passkey] Login init response status:", initRes.status);
      if (!initRes.ok) {
        const errorText = await initRes.text();
        console.error("[passkey] Login init failed:", errorText);
        throw new Error(t("errors.passkey_init_fail"));
      }
      const initJson: { ok: boolean; challenge: string; allowCredentials?: Array<{ id: string; type: PublicKeyCredentialType; transports?: AuthenticatorTransport[] }> } = await initRes.json();

      const cred = (await navigator.credentials.get({
        publicKey: {
          challenge: base64urlToArrayBuffer(initJson.challenge),
          allowCredentials: initJson.allowCredentials?.map((c) => ({
            ...c,
            id: base64urlToArrayBuffer(c.id),
          })),
          userVerification: "preferred",
        },
      })) as PublicKeyCredential | null;

      if (!cred) throw new Error(t("passkey_credential_missing"));

      const resp = cred.response as AuthenticatorAssertionResponse;
      const assertion = {
        id: cred.id,
        rawId: arrayBufferToBase64url(cred.rawId),
        type: cred.type,
        response: {
          clientDataJSON: arrayBufferToBase64url(resp.clientDataJSON),
          authenticatorData: arrayBufferToBase64url(resp.authenticatorData),
          signature: arrayBufferToBase64url(resp.signature),
          userHandle: resp.userHandle ? arrayBufferToBase64url(resp.userHandle) : null,
        },
      };

      // 2) Verifica no backend e recebe cookie HttpOnly
      const verifyRes = await fetch(`${apiUrl}/auth/passkey/login/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ challenge: initJson.challenge, assertion }),
      });
      if (!verifyRes.ok) throw new Error(t("errors.passkey_verify_fail"));

      // 3) Atualiza estado local (sem pubkey de carteira neste fluxo)
      setLoggedIn(true, undefined);
      pushEvent("LOGGED_IN");
    } catch (e: unknown) {
      const maybeMsg = e && typeof e === "object" && "message" in e ? (e as { message?: unknown }).message : undefined;
      const msg = typeof maybeMsg === "string" && maybeMsg.length > 0 ? maybeMsg : t("errors.passkey_verify_fail");
      setError(msg);
    } finally {
      setLoadingPasskey(false);
    }
  }, [apiUrl, email, pushEvent, setLoggedIn, t]);

  const onWallet = useCallback(async (kind: "freighter" | "albedo" | "ledger") => {
    setError("");
    setLoadingWallet(kind);
    const localApiUrl = apiUrl;

    try {
      // Usar os conectores atualizados do wallet store
      const { AllConnectors } = await import("@/lib/wallets/connectors");
      const connector = AllConnectors.find(c => c.id === kind);
      
      if (!connector) {
        setError(t("errors.wallet_connect_fail"));
        return;
      }

      if (!connector.isAvailable()) {
        setError(t(`errors.${kind}_not_found`));
        return;
      }

      if (!localApiUrl) {
        setError(t("errors.need_api"));
        return;
      }

      // Conectar usando o conector atualizado
      const session = await connector.connect();
      const pubkey = session.address;

      if (!pubkey) {
        setError(t(`errors.${kind}_no_pubkey`));
        return;
      }

      console.log(`[login] Connected to ${kind} wallet:`, { address: pubkey, network: session.network });

      // 1) Solicita nonce ao backend
      const nres = await fetch(`${localApiUrl}/auth/nonce`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pubkey }),
      });
      if (!nres.ok) throw new Error(t("errors.wallet_connect_fail"));
      const { nonce } = await nres.json();

      // 2) Assina o nonce (implementação específica por carteira)
      let signature: string | undefined;
      
      if (kind === "freighter") {
        const w = (globalThis as unknown as { freighterApi?: FreighterApi }).freighterApi;
        if (w && w.signMessage) {
          try {
            signature = await w.signMessage(nonce);
          } catch {
            try {
              signature = await (w as unknown as { signMessage: (args: { address: string; message: string }) => Promise<string> }).signMessage({ address: pubkey, message: nonce });
            } catch {
              signature = undefined;
            }
          }
        }
      } else if (kind === "albedo") {
        type AlbedoApi = {
          signMessage?: (args: { message: string; pubkey: string }) => Promise<{ signature: string } | string>;
        };
        const w = (globalThis as unknown as { albedo?: AlbedoApi }).albedo;
        if (w && w.signMessage) {
          const sigRes = await w.signMessage({ message: nonce, pubkey });
          signature = typeof sigRes === "string" ? sigRes : (sigRes as { signature?: string })?.signature;
        }
      }

      if (!signature) throw new Error(t("errors.wallet_connect_fail"));

      // 3) Verifica no backend
      const vres = await fetch(`${localApiUrl}/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pubkey, nonce, signature, provider: kind }),
      });
      if (!vres.ok) throw new Error(t("errors.wallet_connect_fail"));

      // 4) Atualiza estado e saldos
      setLoggedIn(true, pubkey);
      pushEvent("WALLET_CONNECTED");
      pushEvent("LOGGED_IN");
      
      try {
        const b = await getWalletBalances(pubkey);
        setBalances({ xlm: b.xlm, stlt: b.stlt });
      } catch (balanceError) {
        console.warn("[login] Failed to fetch balances:", balanceError);
      }

    } catch (e: unknown) {
      console.error(`[login] Wallet connection failed for ${kind}:`, e);
      const maybeMsg =
        e && typeof e === "object" && "message" in e
          ? (e as { message?: unknown }).message
          : undefined;
      const msg = typeof maybeMsg === "string" && maybeMsg.length > 0 ? maybeMsg : t("errors.wallet_connect_fail");
      setError(msg);
    } finally {
      setLoadingWallet(null);
    }
  }, [apiUrl, pushEvent, setBalances, setLoggedIn, t]);

  const onEmailLogin = useCallback(async () => {
    if (!email.trim()) {
      setError(t("errors.email_required"));
      return;
    }
    if (!apiUrl) {
      setError(t("errors.need_api"));
      return;
    }
    setError("");
    setLoadingEmail(true);
    try {
      // 1) Inicia envio de código
      const initRes = await fetch(`${apiUrl}/auth/email/init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      if (!initRes.ok) throw new Error(t("errors.email_init_fail"));
      const initJson: { ok: boolean; code?: string } = await initRes.json();

      // 2) Solicita o código ao usuário (DEV: mostramos código retornado, se vier)
      const hint = initJson.code ? ` (DEV: ${initJson.code})` : "";
      const input = window.prompt(`${t("email_prompt")}${hint}`) ?? "";
      const code = input.trim();
      if (!code) throw new Error(t("errors.email_code_required"));

      // 3) Verifica código e recebe cookie HttpOnly
      const verifyRes = await fetch(`${apiUrl}/auth/email/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, code }),
      });
      if (!verifyRes.ok) throw new Error(t("errors.email_verify_fail"));

      setLoggedIn(true, undefined);
      pushEvent("LOGGED_IN");
    } catch (e: unknown) {
      const maybeMsg = e && typeof e === "object" && "message" in e ? (e as { message?: unknown }).message : undefined;
      const msg = typeof maybeMsg === "string" && maybeMsg.length > 0 ? maybeMsg : t("errors.email_verify_fail");
      setError(msg);
    } finally {
      setLoadingEmail(false);
    }
  }, [apiUrl, email, pushEvent, setLoggedIn, t]);

  return (
    <div className="p-6">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="text-sm text-slate-400">{t("subtitle")}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("auth")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={onPasskey}
                    className="w-full px-4 py-2 rounded bg-blue-500 text-slate-900 text-sm font-medium disabled:opacity-60"
                    disabled={loadingPasskey}
                  >
                    {loadingPasskey ? t("passkey_login_loading") : t("passkey_login")}
                  </button>
                  <button
                    onClick={onRegisterPasskey}
                    className="w-full px-4 py-2 rounded bg-emerald-500 text-slate-900 text-sm font-medium disabled:opacity-60"
                    disabled={loadingPasskeyReg}
                  >
                    {loadingPasskeyReg ? t("passkey_register_loading") : t("passkey_register")}
                  </button>
                </div>
                <p className="text-xs text-slate-500">{t("passkey_hint")}</p>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-slate-400">{t("wallets_title")}</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => onWallet("freighter")}
                    className="px-4 py-2 rounded bg-slate-800 text-sm hover:bg-slate-700 disabled:opacity-60"
                    disabled={loadingWallet !== null || !freighterAvailable}
                    title={freighterAvailable ? t("freighter_desc") : t("errors.freighter_not_found")}
                  >
                    <span className="inline-flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="text-primary">
                        <circle cx="8" cy="8" r="7" fill="currentColor" opacity="0.2" />
                        <path d="M5 8h6M8 5v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                      <span>{loadingWallet === "freighter" ? t("connecting") : (freighterAvailable ? t("freighter_button") : t("freighter_install"))}</span>
                    </span>
                  </button>
                  <button
                    onClick={() => onWallet("albedo")}
                    className="px-4 py-2 rounded bg-slate-800 text-sm hover:bg-slate-700 disabled:opacity-60"
                    disabled={loadingWallet !== null || !albedoAvailable}
                    title={albedoAvailable ? t("albedo_desc") : t("errors.albedo_not_found")}
                  >
                    <span className="inline-flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="text-primary">
                        <rect x="2" y="2" width="12" height="12" rx="3" fill="currentColor" opacity="0.2" />
                        <path d="M4.5 8h7M8 4.5v7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                      <span>{loadingWallet === "albedo" ? t("connecting") : (albedoAvailable ? t("albedo_button") : t("albedo_install"))}</span>
                    </span>
                  </button>
                  <button
                    onClick={() => onWallet("ledger")}
                    className="px-4 py-2 rounded bg-slate-800 text-sm hover:bg-slate-700 disabled:opacity-60"
                    disabled={loadingWallet !== null}
                    title={t("ledger_desc")}
                  >
                    <span className="inline-flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="text-primary">
                        <path d="M3 5.5h10v5H3z" fill="currentColor" opacity="0.2" />
                        <rect x="3" y="5.5" width="10" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
                        <circle cx="5" cy="8" r="0.9" fill="currentColor" />
                      </svg>
                      <span>{loadingWallet === "ledger" ? t("waiting") : t("ledger_button")}</span>
                    </span>
                  </button>
                </div>
                <div className="text-xs text-slate-500">{t("wallets_hint")}</div>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500">
                <div className="flex-1 h-px bg-slate-800" />
                <span>{t("divider_or")}</span>
                <div className="flex-1 h-px bg-slate-800" />
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded bg-slate-800 px-3 py-2 text-sm outline-none border border-slate-700"
                    placeholder={t("email_placeholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <button
                    onClick={onEmailLogin}
                    className="px-4 py-2 rounded bg-slate-700 text-sm hover:bg-slate-600 disabled:opacity-60"
                    disabled={loadingEmail}
                  >
                    {loadingEmail ? t("email_loading") : t("email_button")}
                  </button>
                </div>
                <p className="text-xs text-slate-500">{t("email_helper")}</p>
              </div>

              {displayError && <div className="text-xs text-red-400">{displayError}</div>}

              <div className="text-xs text-slate-400">
                {t("help_onboarding")} <Link className="text-slate-200 underline" href="/help">{t("help_link")}</Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 p-3 rounded border border-slate-800 bg-slate-900 text-sm">
          {(() => {
            const bannerText = t("kyc_banner");
            const firstWord = bannerText.split(" ")[0];
            const restOfText = bannerText.split(" ").slice(1).join(" ");
            return (
              <>
                <b>{firstWord}</b> {restOfText}
              </>
            );
          })()}
        </div>

        <div className="mt-6 flex justify-start">
          <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center text-primary font-extrabold text-2xl">{"S"}</div>
        </div>

        <div className="mt-6 text-xs text-slate-500 flex items-center justify-center gap-4">
          <Link href="/help" className="hover:text-slate-300">{t("footer_help")}</Link>
          <Link href="#" className="hover:text-slate-300">{t("footer_terms")}</Link>
          <Link href="#" className="hover:text-slate-300">{t("footer_privacy")}</Link>
        </div>
      </div>
    </div>
  );
}
