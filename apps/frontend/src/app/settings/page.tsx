"use client";

import React from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";

export default function SettingsPage() {
  const t = useTranslations("settings");
  
  // Enable real-time updates when the wallet connects
  useRealTimeUpdates();
  const locale = useLocale();
  const router = useRouter();
  // Real backend profile
  const apiUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL, []);
  const [account, setAccount] = useState({
    name: "",
    email: "",
    phone: "",
    userId: "",
    kyc: "Pending" as "Verified" | "Pending" | "Rejected",
  });
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [errorProfile, setErrorProfile] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      if (!apiUrl) return;
      setLoadingProfile(true);
      setErrorProfile(null);
      try {
        const res = await fetch(`${apiUrl}/auth/me`, { credentials: "include" });
        if (!res.ok) throw new Error("fail_profile");
        const data = await res.json();
        const user = data?.user || {};
        if (!active) return;
        setAccount((prev) => ({
          ...prev,
          name: user.name ?? prev.name,
          email: user.email ?? prev.email,
          userId: user.id ?? prev.userId,
        }));
      } catch {
        if (!active) return;
        setErrorProfile(t("account.profile_error"));
      } finally {
        if (active) setLoadingProfile(false);
      }
    }
    loadProfile();
    return () => {
      active = false;
    };
  }, [apiUrl, t]);

  // Security
  const [twoFA, setTwoFA] = useState<{ enabled: boolean; method: "SMS" | "Email" | "App" }>(
    { enabled: true, method: "App" }
  );
  const [biometrics, setBiometrics] = useState(true);
  const [devices, setDevices] = useState(
    [
      { id: "d1", name: "Chrome • Linux", lastAccess: "2025-08-22 19:10", current: true },
      { id: "d2", name: "Safari • iOS", lastAccess: "2025-08-18 08:31", current: false },
    ]
  );

  // Preferences
  const [push, setPush] = useState(true);
  // Email options will come from i18n (raw array); initial fallback will be the first item
  const emailOpts = (t.raw("prefs.email_opts") as string[]) || ["All", "Security Only", "None"];
  const [emailNotif, setEmailNotif] = useState<string>(emailOpts?.[1] ?? "Security Only");
  const [smsNotif, setSmsNotif] = useState(false);
  const [txThreshold, setTxThreshold] = useState<number>(500); // alert >= X

  // Privacy
  const [consentLGPD, setConsentLGPD] = useState(true);
  const [permissions, setPermissions] = useState({ marketing: false, analytics: true });

  // Language and theme
  const [lang, setLang] = useState<"pt" | "en">("en");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Integrations
  const [integrations, setIntegrations] = useState({
    externalWallet: true,
    google: false,
    apple: false,
    autoSyncBalance: false,
  });

  // Limits
  const [limits, setLimits] = useState({ daily: 5000, monthly: 50000 });
  const requests = useMemo(() => [
    { date: "2025-07-02", from: 3000, to: 5000, status: "Approved" },
    { date: "2025-05-10", from: 1000, to: 3000, status: "Approved" },
  ], []);

  // App info
  const app = { version: "1.2.5", releasedAt: "August 2025" };

  // Save real data (only fields supported by backend in this MVP)
  async function saveAccount() {
    if (!apiUrl) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`${apiUrl}/auth/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: account.name ?? null }),
      });
      if (res.status === 401) {
        // session expired
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error("save_failed");
      const data = await res.json();
      const user = data?.user || {};
      setAccount((prev) => ({
        ...prev,
        name: user.name ?? prev.name,
        email: user.email ?? prev.email,
        userId: user.id ?? prev.userId,
      }));
    } catch {
      setSaveError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }
  function changePassword() {
    alert(t("security.change_password_alert"));
  }
  function toggle2FA() {
    setTwoFA((s) => ({ ...s, enabled: !s.enabled }));
  }
  function rotate2FAMethod() {
    setTwoFA((s) => ({
      ...s,
      method: s.method === "App" ? "SMS" : s.method === "SMS" ? "Email" : "App",
    }));
  }
  function revokeDevice(id: string) {
    setDevices((d) => d.filter((x) => x.id !== id));
    alert(t("security.end_session_alert"));
  }
  function emergencyLock() {
    alert(t("security.emergency_lock_alert"));
  }
  function exportData() {
    alert(t("privacy.export_alert"));
  }
  function requestLimitIncrease() {
    alert(t("limits.request_increase_alert"));
  }
  function closeAccount() {
    const ok = confirm(t("close.warn"));
    if (ok) alert(t("close.close_alert"));
  }

  // Apply language change: set cookie and do full reload preserving other params
  function applyLanguage(next: "pt" | "en") {
    const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";
    const currentSearch = typeof window !== "undefined" ? window.location.search : "";
    const params = new URLSearchParams(currentSearch);
    try {
      document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000`;
    } catch {}
    // remove ?lang se existir
    if (params.has("lang")) params.delete("lang");
    const qs = params.toString();
    const cleanHref = qs ? `${currentPath}?${qs}` : currentPath;
    const hrefWithBuster = `${cleanHref}${qs ? "&" : "?"}_l=${Date.now()}`;
    setLang(next);
    if (typeof window !== "undefined") {
      window.location.replace(hrefWithBuster);
    } else {
      router.replace(hrefWithBuster);
      router.refresh();
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 px-4 py-6 sm:px-6 lg:px-8">
      <Image src="/capa.png" alt="Stellaro background" fill priority sizes="100vw" className="object-cover object-center opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/92 to-slate-900/78" />
      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-8 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <div className="text-xs text-slate-500">{t("subtitle")}</div>
        </div>

      {/* 1. Account Data */}
      <Card>
        <CardHeader>
          <CardTitle>{t("account.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {loadingProfile && (
            <div className="text-xs text-slate-400">{t("account.loading")}</div>
          )}
          {errorProfile && (
            <div className="text-xs text-rose-400">{errorProfile}</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="text-slate-400 text-xs">{t("account.name")}</div>
              <input className="w-full rounded bg-slate-900 px-3 py-2 border border-slate-800"
                     id="account-name"
                     title="Account name"
                     aria-label="Account name"
                     value={account.name}
                     onChange={(e) => setAccount({ ...account, name: e.target.value })} />
            </div>
            <div>
              <div className="text-slate-400 text-xs">{t("account.email")}</div>
              <input className="w-full rounded bg-slate-900 px-3 py-2 border border-slate-800"
                     id="account-email"
                     title="Account email"
                     aria-label="Account email"
                     value={account.email}
                     onChange={(e) => setAccount({ ...account, email: e.target.value })} />
            </div>
            <div>
              <div className="text-slate-400 text-xs">{t("account.phone")}</div>
              <input className="w-full rounded bg-slate-900 px-3 py-2 border border-slate-800"
                     id="account-phone"
                     title="Account phone"
                     aria-label="Account phone"
                     value={account.phone}
                     onChange={(e) => setAccount({ ...account, phone: e.target.value })} />
            </div>
            <div>
              <div className="text-slate-400 text-xs">{t("account.user_id")}</div>
              <div className="rounded bg-slate-900 px-3 py-2 border border-slate-800 select-all">{account.userId || "—"}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className={`px-2 py-1 rounded ${account.kyc === "Verified" ? "bg-emerald-900/40 text-emerald-300" : account.kyc === "Pending" ? "bg-amber-900/40 text-amber-300" : "bg-rose-900/40 text-rose-300"}`}>{t("account.kyc", { status: account.kyc })}</span>
            <button onClick={saveAccount} disabled={saving} className={`px-3 py-2 rounded text-sm ${saving ? "bg-slate-700 text-slate-400" : "bg-primary text-black"}`}>
              {saving ? "…" : t("account.save")}
            </button>
            {saveError && <span className="text-rose-400">{saveError}</span>}
          </div>
        </CardContent>
      </Card>

      {/* 2. Security */}
      <Card>
        <CardHeader>
          <CardTitle>{t("security.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex flex-wrap gap-2">
            <button onClick={changePassword} className="px-3 py-2 rounded bg-slate-800">{t("security.change_password")}</button>
            <button onClick={toggle2FA} className="px-3 py-2 rounded bg-slate-800">{t("security.twofa", { state: twoFA.enabled ? t("prefs.on") : t("prefs.off") })}</button>
            <button onClick={rotate2FAMethod} className="px-3 py-2 rounded bg-slate-800">{t("security.twofa_method", { method: twoFA.method })}</button>
            <button onClick={() => setBiometrics((b) => !b)} className="px-3 py-2 rounded bg-slate-800">{t("security.biometrics", { state: biometrics ? t("prefs.on") : t("prefs.off") })}</button>
            <button onClick={emergencyLock} className="px-3 py-2 rounded bg-rose-900/40 text-rose-200">{t("security.emergency_lock")}</button>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-2">{t("security.devices_title")}</div>
            <div className="space-y-2">
              {devices.map((d) => (
                <div key={d.id} className="flex items-center justify-between bg-slate-900 rounded px-3 py-2">
                  <div>
                    <div>{d.name} {d.current ? t("security.current") : ""}</div>
                    <div className="text-xs text-slate-500">{t("security.last_access", { date: d.lastAccess })}</div>
                  </div>
                  {!d.current && (
                    <button onClick={() => revokeDevice(d.id)} className="px-2 py-1 rounded bg-slate-800 text-xs">{t("security.end_session")}</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Notifications & Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>{t("prefs.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <div className="text-slate-400 text-xs">{t("prefs.push")}</div>
              <button onClick={() => setPush((v) => !v)} className="px-3 py-2 rounded bg-slate-800 w-full">
                {push ? t("prefs.on") : t("prefs.off")}
              </button>
            </div>
            <div>
              <div className="text-slate-400 text-xs">{t("prefs.email")}</div>
              <div className="flex gap-2">
                {emailOpts.map((opt) => (
                  <button key={opt} onClick={() => setEmailNotif(opt)} className={`px-3 py-2 rounded ${emailNotif === opt ? "bg-primary text-black" : "bg-slate-800"}`}>{opt}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-xs">{t("prefs.sms")}</div>
              <button onClick={() => setSmsNotif((v) => !v)} className="px-3 py-2 rounded bg-slate-800 w-full">
                {smsNotif ? t("prefs.on") : t("prefs.off")}
              </button>
            </div>
          </div>
            <div>
              <div className="text-slate-400 text-xs">{t("prefs.tx_alert")} (R$)</div>
              <input type="number" min={0} id="tx-threshold" title="Transaction alert threshold" aria-label="Transaction alert threshold (BRL)" className="rounded bg-slate-900 px-3 py-2 border border-slate-800 w-40"
                     value={txThreshold}
                     onChange={(e) => setTxThreshold(Number(e.target.value))} />
          </div>
        </CardContent>
      </Card>

      {/* 4. Privacy */}
      <Card>
        <CardHeader>
          <CardTitle>{t("privacy.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setConsentLGPD((v) => !v)} className="px-3 py-2 rounded bg-slate-800">{t("privacy.lgpd", { state: consentLGPD ? t("prefs.on") : t("prefs.off") })}</button>
            <button onClick={() => setPermissions((p) => ({ ...p, marketing: !p.marketing }))} className="px-3 py-2 rounded bg-slate-800">{t("privacy.marketing", { state: permissions.marketing ? t("prefs.on") : t("prefs.off") })}</button>
            <button onClick={() => setPermissions((p) => ({ ...p, analytics: !p.analytics }))} className="px-3 py-2 rounded bg-slate-800">{t("privacy.analytics", { state: permissions.analytics ? t("prefs.on") : t("prefs.off") })}</button>
            <button onClick={exportData} className="px-3 py-2 rounded bg-slate-800">{t("privacy.export")}</button>
          </div>
          <div className="text-xs text-slate-500">{t("privacy.summary")}</div>
        </CardContent>
      </Card>

      {/* 5. Language and Theme */}
      <Card>
        <CardHeader>
          <CardTitle>{t("lang_theme.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex flex-wrap gap-2">
            <div>
              <div className="text-slate-400 text-xs">{t("lang_theme.language")}</div>
              {(["pt", "en"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => applyLanguage(l)}
                  className={`px-3 py-2 rounded mr-2 ${lang === l ? "bg-primary text-black" : "bg-slate-800"}`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <div>
              <div className="text-slate-400 text-xs">{t("lang_theme.theme")}</div>
              {(["dark", "light"] as const).map((tname) => (
                <button key={tname} onClick={() => setTheme(tname)} className={`px-3 py-2 rounded mr-2 ${theme === tname ? "bg-primary text-black" : "bg-slate-800"}`}>{tname === "dark" ? t("lang_theme.dark") : t("lang_theme.light")}</button>
              ))}
            </div>
          </div>
          <div className="text-xs text-slate-500">{t("lang_theme.note")}</div>
        </CardContent>
      </Card>

      {/* 6. Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>{t("integrations.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button onClick={() => setIntegrations((s) => ({ ...s, externalWallet: !s.externalWallet }))} className="px-3 py-2 rounded bg-slate-800 text-left">{t("integrations.external_wallet", { state: integrations.externalWallet ? t("prefs.on") : t("prefs.off") })}</button>
            <button onClick={() => setIntegrations((s) => ({ ...s, google: !s.google }))} className="px-3 py-2 rounded bg-slate-800 text-left">{t("integrations.google", { state: integrations.google ? t("prefs.on") : t("prefs.off") })}</button>
            <button onClick={() => setIntegrations((s) => ({ ...s, apple: !s.apple }))} className="px-3 py-2 rounded bg-slate-800 text-left">{t("integrations.apple", { state: integrations.apple ? t("prefs.on") : t("prefs.off") })}</button>
            <button onClick={() => setIntegrations((s) => ({ ...s, autoSyncBalance: !s.autoSyncBalance }))} className="px-3 py-2 rounded bg-slate-800 text-left">{t("integrations.auto_sync", { state: integrations.autoSyncBalance ? t("prefs.on") : t("prefs.off") })}</button>
          </div>
        </CardContent>
      </Card>

      {/* 7. Account Limits */}
      <Card>
        <CardHeader>
          <CardTitle>{t("limits.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>{t("limits.daily")}: <b>R$ {limits.daily.toLocaleString(locale)}</b></div>
            <div>{t("limits.monthly")}: <b>R$ {limits.monthly.toLocaleString(locale)}</b></div>
            <div className="flex gap-2">
              <button onClick={requestLimitIncrease} className="px-3 py-2 rounded bg-primary text-black">{t("limits.request_increase")}</button>
              <button onClick={() => setLimits({ daily: 3000, monthly: 30000 })} className="px-3 py-2 rounded bg-slate-800">{t("limits.reset")}</button>
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">{t("limits.history")}</div>
            <div className="space-y-1">
              {requests.map((r, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-900 rounded px-3 py-2">
                  <div>{r.date}</div>
                  <div className="text-xs text-slate-400">{t("limits.from_to", { from: `R$ ${r.from.toLocaleString(locale)}`, to: `R$ ${r.to.toLocaleString(locale)}` })}</div>
                  <div className="text-xs">{t("limits.status", { status: r.status })}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 8. Support & Help */}
      <Card>
        <CardHeader>
          <CardTitle>{t("support.title")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <div className="flex flex-wrap gap-2">
            <Link href="/help" className="px-3 py-2 rounded bg-slate-800">{t("support.help_center")}</Link>
            <Link href="/help" className="px-3 py-2 rounded bg-slate-800">{t("support.open_ticket")}</Link>
            <Link href="/help" className="px-3 py-2 rounded bg-slate-800">{t("support.report_bug")}</Link>
          </div>
        </CardContent>
      </Card>

      {/* 9. Legal Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t("legal.title")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <div className="flex flex-wrap gap-2">
            <Link href="/docs" className="px-3 py-2 rounded bg-slate-800">{t("legal.terms")}</Link>
            <Link href="/docs" className="px-3 py-2 rounded bg-slate-800">{t("legal.privacy")}</Link>
            <Link href="/docs" className="px-3 py-2 rounded bg-slate-800">{t("legal.fees")}</Link>
            <Link href="/docs" className="px-3 py-2 rounded bg-slate-800">{t("legal.contracts")}</Link>
            <Link href="/docs" className="px-3 py-2 rounded bg-slate-800">{t("legal.transparency")}</Link>
          </div>
        </CardContent>
      </Card>

      {/* 10. Account Closure */}
      <Card>
        <CardHeader>
          <CardTitle>{t("close.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="text-xs text-amber-300">{t("close.warn")}</div>
          <button onClick={closeAccount} className="px-3 py-2 rounded bg-rose-900/40 text-rose-200">{t("close.close")}</button>
        </CardContent>
      </Card>

      {/* 11. About the Application */}
      <Card>
        <CardHeader>
          <CardTitle>{t("about.title")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <div>{t("about.version", { version: app.version, releasedAt: app.releasedAt })}</div>
          <div className="text-xs text-slate-500">{t("about.notes")}</div>
        </CardContent>
      </Card>
    </div>
      </div>
  );
}
