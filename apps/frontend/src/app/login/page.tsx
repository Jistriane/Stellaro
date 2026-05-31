"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppStore } from "@/store/app";
import { getWalletBalances } from "@/lib/soroban";
import { useTranslations } from "next-intl";
import { useWalletStore } from "@/state/wallet";

type FreighterApi = {
  getPublicKey(): Promise<string>;
  signMessage?: (message: string) => Promise<string>;
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
  // Modal states for email code verification
  const [showEmailCodeModal, setShowEmailCodeModal] = useState(false);
  const [emailCodeInput, setEmailCodeInput] = useState("");
  const [emailCodeHint, setEmailCodeHint] = useState("");
  const [pendingEmailVerification, setPendingEmailVerification] = useState<{ email: string; challenge: string } | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  
  const setLoggedIn = useAppStore((s) => s.setLoggedIn);
  const setBalances = useAppStore((s) => s.setBalances);
  const pushEvent = useAppStore((s) => s.pushEvent);
  const walletAvailable = useWalletStore((s) => s.available);
  const refreshWalletAvailable = useWalletStore((s) => s.refreshAvailable);
  const tLoginErrors = useTranslations("login.errors");

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
    // Fallback to the message itself if not a known error code
    // This keeps passkey/email error messages that are already i18n
    return msg;
  }, [error, tLoginErrors]);

  useEffect(() => {
    // Integrates global wallet detection
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

  // Freighter detection is now done entirely by wallet store
  // The useEffect above already syncs local state with the store

  // Albedo detection is now done entirely by wallet store
  // The useEffect above already syncs local state with the store

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
      // Check WebAuthn compatibility
      if (!navigator.credentials || !window.PublicKeyCredential) {
        setError("WebAuthn is not supported in this browser.");
        return;
      }

      if (!apiUrl) {
        setError(tLoginErrors("need_api"));
        return;
      }
      if (!email.trim()) {
        setError(tLoginErrors("need_email_register"));
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
        throw new Error(tLoginErrors("passkey_register_init_fail"));
      }
      const initJson: { challenge: string; rpId?: string; user?: { id: string; name?: string } } = await initRes.json();

      const publicKey: PublicKeyCredentialCreationOptions = {
        challenge: base64urlToArrayBuffer(initJson.challenge),
        rp: { name: "Stellaro", id: initJson.rpId ?? window.location.hostname },
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
      if (!verifyRes.ok) throw new Error(tLoginErrors("passkey_register_verify_fail"));

      // 3) Signals success (may keep user logged in if backend sets cookie)
      setLoggedIn(true, undefined);
      pushEvent("LOGGED_IN");
    } catch (e: unknown) {
      const maybeMsg = e && typeof e === "object" && "message" in e ? (e as { message?: unknown }).message : undefined;
      const msg = typeof maybeMsg === "string" && maybeMsg.length > 0 ? maybeMsg : tLoginErrors("passkey_register_verify_fail");
      setError(msg);
    } finally {
      setLoadingPasskeyReg(false);
    }
  }, [apiUrl, email, pushEvent, setLoggedIn, t, tLoginErrors]);

  const onPasskey = useCallback(async () => {
    setError("");
    setLoadingPasskey(true);
    try {
      // Check WebAuthn compatibility
      if (!navigator.credentials || !window.PublicKeyCredential) {
        setError("WebAuthn is not supported in this browser.");
        return;
      }

      if (!apiUrl) {
        setError(tLoginErrors("need_api"));
        return;
      }
      if (!email.trim()) {
        setError(tLoginErrors("need_email_login"));
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
        throw new Error(tLoginErrors("passkey_init_fail"));
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
      if (!verifyRes.ok) throw new Error(tLoginErrors("passkey_verify_fail"));

      // 3) Update local state (no wallet pubkey in this flow)
      setLoggedIn(true, undefined);
      pushEvent("LOGGED_IN");
    } catch (e: unknown) {
      const maybeMsg = e && typeof e === "object" && "message" in e ? (e as { message?: unknown }).message : undefined;
      const msg = typeof maybeMsg === "string" && maybeMsg.length > 0 ? maybeMsg : tLoginErrors("passkey_verify_fail");
      setError(msg);
    } finally {
      setLoadingPasskey(false);
    }
  }, [apiUrl, email, pushEvent, setLoggedIn, t, tLoginErrors]);

  const onWallet = useCallback(async (kind: "freighter" | "albedo" | "ledger") => {
    setError("");
    setLoadingWallet(kind);
    const localApiUrl = apiUrl;

    try {
      if (kind === "ledger") {
        throw new Error("ERR_LEDGER_UNSUPPORTED");
      }

      // Usar os conectores atualizados do wallet store
      const { AllConnectors } = await import("@/lib/wallets/connectors");
      const connector = AllConnectors.find(c => c.id === kind);
      
      if (!connector) {
        setError(tLoginErrors("wallet_connect_fail"));
        return;
      }

      if (!localApiUrl) {
        setError(tLoginErrors("need_api"));
        return;
      }

      // Conectar usando o conector atualizado
      const session = await connector.connect();
      const pubkey = session.address;

      if (!pubkey) {
        setError(tLoginErrors(`${kind}_no_pubkey`));
        return;
      }

      console.log(`[login] Connected to ${kind} wallet:`, { address: pubkey, network: session.network });

      // 1) Solicita nonce ao backend
      const nres = await fetch(`${localApiUrl}/auth/nonce`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pubkey }),
      });
      if (!nres.ok) throw new Error(tLoginErrors("wallet_connect_fail"));
      const { nonce } = await nres.json();

      // 2) Signs the nonce (implementation specific per wallet)
      let signature: string | undefined;
      
      if (kind === "freighter") {
        const w = (globalThis as unknown as { freighterApi?: FreighterApi }).freighterApi;
        if (w?.signMessage) {
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

        if (!signature) {
          try {
            const freighterApi = await import("@stellar/freighter-api");
            const maybeSignMessage = (freighterApi as unknown as { signMessage?: (...args: unknown[]) => Promise<unknown> }).signMessage;
            if (typeof maybeSignMessage === "function") {
              const out = await maybeSignMessage(nonce, { address: pubkey });
              if (typeof out === "string") {
                signature = out;
              } else if (out && typeof out === "object") {
                const obj = out as Record<string, unknown>;
                const candidates = [obj.signature, obj.signedMessage, obj.signed_message];
                for (const c of candidates) {
                  if (typeof c === "string" && c.length > 0) {
                    signature = c;
                    break;
                  }
                }
              }
            }
          } catch {
            // handled by generic error below
          }
        }
      } else if (kind === "albedo") {
        type AlbedoApi = {
          signMessage?: (args: { message: string; pubkey: string }) => Promise<{ signature: string } | string>;
        };
        const w = (globalThis as unknown as { albedo?: AlbedoApi }).albedo;
        if (w && w.signMessage) {
          const sigRes = await w.signMessage({ message: nonce, pubkey });
          if (typeof sigRes === "string") {
            signature = sigRes;
          } else {
            const obj = sigRes as Record<string, unknown>;
            const candidates = [obj.signature, obj.signedMessage, obj.signed_message];
            for (const c of candidates) {
              if (typeof c === "string" && c.length > 0) {
                signature = c;
                break;
              }
            }
          }
        }
      }

      if (!signature) throw new Error(tLoginErrors("wallet_connect_fail"));

      // 3) Verifica no backend
      const vres = await fetch(`${localApiUrl}/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pubkey, nonce, signature, provider: kind }),
      });
      if (!vres.ok) throw new Error(tLoginErrors("wallet_connect_fail"));

      // 4) Update state and balances
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
      const maybeCode = e && typeof e === "object" && "message" in e ? (e as { message?: unknown }).message : undefined;
      const code = typeof maybeCode === "string" ? maybeCode.toUpperCase() : "";
      if (code.includes("ERR_")) {
        console.warn(`[login] Wallet connection blocked for ${kind}:`, code);
      } else {
        console.error(`[login] Wallet connection failed for ${kind}:`, e);
      }
      const maybeMsg =
        e && typeof e === "object" && "message" in e
          ? (e as { message?: unknown }).message
          : undefined;
      let msg = typeof maybeMsg === "string" && maybeMsg.length > 0 ? maybeMsg : tLoginErrors("wallet_connect_fail");
      if (code.includes("ERR_FREIGHTER_NOT_FOUND")) {
        msg = tLoginErrors("freighter_not_found");
      } else if (code.includes("ERR_ALBEDO_NOT_FOUND")) {
        msg = tLoginErrors("albedo_not_found");
      }
      setError(msg);
    } finally {
      setLoadingWallet(null);
    }
  }, [apiUrl, pushEvent, setBalances, setLoggedIn, tLoginErrors]);

  const onEmailLogin = useCallback(async () => {
    const normalizedEmail = email.trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
    if (!normalizedEmail || !emailOk) {
      setError(tLoginErrors("email_required"));
      emailInputRef.current?.focus();
      return;
    }
    if (!apiUrl) {
      setError(tLoginErrors("need_api"));
      return;
    }
    setError("");
    setLoadingEmail(true);
    setEmailCodeInput("");
    try {
      // 1) Initiate code sending
      const initRes = await fetch(`${apiUrl}/auth/email/init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: normalizedEmail }),
      });
      if (!initRes.ok) throw new Error(tLoginErrors("email_init_fail"));
      const initJson: { ok: boolean; code?: string } = await initRes.json();

      // 2) Show modal for code input instead of using prompt()
      const hint = initJson.code ? `(DEV: ${initJson.code})` : "";
      setEmailCodeHint(hint);
      setPendingEmailVerification({ email: normalizedEmail, challenge: initJson.code || "" });
      setShowEmailCodeModal(true);
      setLoadingEmail(false);
    } catch (e: unknown) {
      const maybeMsg = e && typeof e === "object" && "message" in e ? (e as { message?: unknown }).message : undefined;
      const msg = typeof maybeMsg === "string" && maybeMsg.length > 0 ? maybeMsg : tLoginErrors("email_init_fail");
      setError(msg);
      setLoadingEmail(false);
    }
  }, [apiUrl, email, tLoginErrors]);

  const onEmailCodeSubmit = useCallback(async (code: string) => {
    if (!code.trim()) {
      setError(tLoginErrors("email_code_required"));
      return;
    }
    if (!apiUrl || !pendingEmailVerification) {
      setError(tLoginErrors("email_verify_fail"));
      return;
    }
    setError("");
    setLoadingEmail(true);
    try {
      // 3) Verifies code and receives HttpOnly cookie
      const verifyRes = await fetch(`${apiUrl}/auth/email/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: pendingEmailVerification.email, code: code.trim() }),
      });
      if (!verifyRes.ok) throw new Error(tLoginErrors("email_verify_fail"));

      setLoggedIn(true, undefined);
      pushEvent("LOGGED_IN");
      setShowEmailCodeModal(false);
      setPendingEmailVerification(null);
    } catch (e: unknown) {
      const maybeMsg = e && typeof e === "object" && "message" in e ? (e as { message?: unknown }).message : undefined;
      const msg = typeof maybeMsg === "string" && maybeMsg.length > 0 ? maybeMsg : tLoginErrors("email_verify_fail");
      setError(msg);
      setLoadingEmail(false);
    }
  }, [apiUrl, email, pendingEmailVerification, pushEvent, setLoggedIn, tLoginErrors]);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <Image
        src="/capa.png"
        alt="Stellaro background"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center opacity-35"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/88 to-background/70" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(var(--stellaro-accent-rgb),0.14),transparent_28%),radial-gradient(circle_at_80%_75%,rgba(197,135,230,0.10),transparent_26%)]" />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:min-h-[calc(100vh-7rem)]">
        <div className="space-y-8 text-left">
          <div className="inline-flex items-center gap-3 rounded-full border border-border/70 bg-card/40 px-4 py-2 backdrop-blur-sm">
            <Image src="/logo.png" alt="Stellaro logo" width={48} height={48} className="h-10 w-10 rounded-md object-contain" />
            <div className="text-left">
              <p className="font-mono text-xs uppercase tracking-[0.35em] text-muted-foreground">Stellaro</p>
              <p className="text-sm text-foreground">Identity, DeFi and compliance on Soroban</p>
            </div>
          </div>

          <div className="max-w-2xl space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {t("title")}
            </h1>
            <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              {t("subtitle")}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 max-w-3xl">
            <div className="rounded-2xl border border-border/60 bg-card/35 p-4 backdrop-blur-sm">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Passkeys</p>
              <p className="mt-3 text-sm leading-6 text-foreground">Passwordless authentication with WebAuthn flow and email recovery.</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/35 p-4 backdrop-blur-sm">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Wallets</p>
              <p className="mt-3 text-sm leading-6 text-foreground">Freighter, Albedo, and Ledger with verification and signing in the frontend.</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/35 p-4 backdrop-blur-sm">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">KYC</p>
              <p className="mt-3 text-sm leading-6 text-foreground">Verified identity to access regulated features and RWA modules.</p>
            </div>
          </div>

          <div className="rounded-3xl border border-border/40 bg-card/40 p-6 text-sm leading-6 text-muted-foreground backdrop-blur-md max-w-2xl">
            {(() => {
              const bannerText = t("kyc_banner");
              const firstWord = bannerText.split(" ")[0];
              const restOfText = bannerText.split(" ").slice(1).join(" ");
              return (
                <>
                  <b className="text-foreground">{firstWord}</b> {restOfText}
                </>
              );
            })()}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 rounded-[2rem] bg-primary/10 blur-3xl" />
          <Card className="relative overflow-hidden border border-border/60 bg-card/50 backdrop-blur-xl shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
            <CardHeader className="border-b border-border/60 bg-card/40">
              <CardTitle className="flex items-center gap-3 text-foreground">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-secondary/30">
                  <Image src="/logo.png" alt="Stellaro" width={24} height={24} className="h-6 w-6 object-contain" />
                </span>
                {t("auth")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 sm:p-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      onClick={onPasskey}
                      className="w-full rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-primary/15 disabled:opacity-60"
                      disabled={loadingPasskey}
                    >
                      {loadingPasskey ? t("passkey_login_loading") : t("passkey_login")}
                    </button>
                    <button
                      onClick={onRegisterPasskey}
                      className="w-full rounded-xl border border-border/70 bg-secondary/30 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary/50 disabled:opacity-60"
                      disabled={loadingPasskeyReg}
                    >
                      {loadingPasskeyReg ? t("passkey_register_loading") : t("passkey_register")}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">{t("passkey_hint")}</p>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">{t("wallets_title")}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      onClick={() => onWallet("freighter")}
                      className="rounded-xl border border-border/60 bg-secondary/30 px-4 py-3 text-sm text-foreground transition-colors hover:bg-secondary/50 disabled:opacity-60"
                      disabled={loadingWallet !== null || !freighterAvailable}
                      title={freighterAvailable ? t("freighter_desc") : tLoginErrors("freighter_not_found")}
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
                      className="rounded-xl border border-border/60 bg-secondary/30 px-4 py-3 text-sm text-foreground transition-colors hover:bg-secondary/50 disabled:opacity-60"
                      disabled={loadingWallet !== null || !albedoAvailable}
                      title={albedoAvailable ? t("albedo_desc") : tLoginErrors("albedo_not_found")}
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
                      className="rounded-xl border border-border/60 bg-secondary/30 px-4 py-3 text-sm text-foreground transition-colors hover:bg-secondary/50 disabled:opacity-60"
                      disabled={true}
                      title={tLoginErrors("ledger_unsupported")}
                    >
                      <span className="inline-flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="text-primary">
                          <path d="M3 5.5h10v5H3z" fill="currentColor" opacity="0.2" />
                          <rect x="3" y="5.5" width="10" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
                          <circle cx="5" cy="8" r="0.9" fill="currentColor" />
                        </svg>
                        <span>{t("ledger_button")} ({t("waiting")})</span>
                      </span>
                    </button>
                  </div>
                  <div className="text-xs text-muted-foreground">{t("wallets_hint")}</div>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex-1 h-px bg-border/60" />
                  <span>{t("divider_or")}</span>
                  <div className="flex-1 h-px bg-border/60" />
                </div>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      ref={emailInputRef}
                      className="flex-1 rounded-xl border border-border/60 bg-secondary/30 px-3 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/60"
                      placeholder={t("email_placeholder")}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <button
                      onClick={onEmailLogin}
                      className="rounded-xl border border-primary/30 bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                      disabled={loadingEmail}
                    >
                      {loadingEmail ? t("email_loading") : t("email_button")}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">{t("email_helper")}</p>
                </div>

                {displayError && <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{displayError}</div>}

                <div className="text-xs text-muted-foreground">
                  {t("help_onboarding")} <Link className="text-foreground underline decoration-border/60 underline-offset-4" href="/help">{t("help_link")}</Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
            <Link href="/help" className="hover:text-foreground">{t("footer_help")}</Link>
            <Link href="#" className="hover:text-foreground">{t("footer_terms")}</Link>
            <Link href="#" className="hover:text-foreground">{t("footer_privacy")}</Link>
          </div>
        </div>
      </div>

      {/* Email Code Verification Modal */}
      {showEmailCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-96 border border-border/60 bg-card/60 backdrop-blur-xl shadow-2xl">
            <CardHeader className="border-b border-border/60 bg-card/40">
              <CardTitle className="text-foreground">{t("email_code_title") || "Enter Verification Code"}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t("email_code_label") || "Verification Code"}
                </label>
                <p className="text-xs text-muted-foreground mb-3">{t("email_code_hint") || "Enter the code sent to your email"}</p>
                {emailCodeHint && <p className="text-xs text-primary mb-3">{emailCodeHint}</p>}
                <input
                  type="text"
                  value={emailCodeInput}
                  onChange={(e) => setEmailCodeInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && onEmailCodeSubmit(emailCodeInput)}
                  placeholder="000000"
                  className="w-full rounded-xl border border-border/60 bg-secondary/30 px-4 py-3 text-center text-2xl font-mono text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/60"
                  disabled={loadingEmail}
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowEmailCodeModal(false);
                    setPendingEmailVerification(null);
                    setEmailCodeInput("");
                    setError("");
                  }}
                  className="flex-1 rounded-xl border border-border/70 bg-secondary/30 px-4 py-3 text-sm text-foreground transition-colors hover:bg-secondary/50 disabled:opacity-60"
                  disabled={loadingEmail}
                >
                  {t("cancel") || "Cancel"}
                </button>
                <button
                  onClick={() => onEmailCodeSubmit(emailCodeInput)}
                  className="flex-1 rounded-xl border border-primary/30 bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                  disabled={loadingEmail || !emailCodeInput.trim()}
                >
                  {loadingEmail ? (t("verifying") || "Verifying...") : (t("verify") || "Verify")}
                </button>
              </div>
              {error && showEmailCodeModal && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
