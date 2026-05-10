"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useRealTimeUpdates } from "@/hooks/useRealTimeUpdates";

type UserProfile = {
  id?: string;
  name?: string | null;
  email?: string | null;
  nickname?: string | null;
  phone?: string | null;
  dob?: string | null;
  publicKey?: string | null;
  avatarUrl?: string | null;
};

export default function ProfilePage() {
  const t = useTranslations("profile");
  
  // Enable real-time updates when the wallet connects
  useRealTimeUpdates();
  const tc = useTranslations("common");
  const [user, setUser] = useState<UserProfile | null>(null);
  useEffect(() => {
    let active = true;
    const enableProfileSync = process.env.NEXT_PUBLIC_ENABLE_PROFILE_SYNC === "true";

    if (!enableProfileSync) {
      return () => {
        active = false;
      };
    }

    async function load() {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) return;

      try {
        const res = await fetch(`${apiUrl}/auth/me`, { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;
        setUser(data?.user ?? null);
      } catch {
        // silent: keep placeholders when backend is unavailable
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const kyc = {
    status: "In progress" as
      | "Not started"
      | "In progress"
      | "Waiting for validation"
      | "Approved"
      | "Rejected",
    level: "Basic",
    progressPct: 60,
    nextStep: "Upload ID photo",
    limitCurrent: 2000,
    limitNext: 50000,
  };

  const documents = [
    { key: "rg", label: "ID (front/back)", status: "Under review", preview: true },
    { key: "selfie", label: "Selfie holding ID", status: "Pending", preview: false },
    { key: "address", label: "Proof of address", status: "Approved", preview: true },
  ];

  const pendingSteps = ["Upload ID", "Upload selfie", "Confirm address"];

  const history = [
    { date: "2025-08-21 14:10", item: "Proof of address", status: "Approved" },
    { date: "2025-08-20 10:32", item: "ID", status: "Under review" },
    { date: "2025-08-19 09:05", item: "Selfie", status: "Rejected — resubmit" },
  ];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 px-4 py-6 sm:px-6 lg:px-8">
      <Image
        src="/capa.png"
        alt="Stellaro background"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center opacity-25"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/92 to-slate-900/78" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(96,165,250,0.14),transparent_28%),radial-gradient(circle_at_82%_80%,rgba(16,185,129,0.10),transparent_24%)]" />

      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-8">
        <header className="grid gap-6 rounded-[2rem] border border-slate-800/70 bg-slate-950/55 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur-md lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 rounded-full border border-slate-700/80 bg-slate-950/60 px-4 py-2 backdrop-blur-sm">
              <Image src="/logo.png" alt="Stellaro logo" width={48} height={48} className="h-10 w-10 rounded-md object-contain" />
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Profile</p>
                <p className="text-sm text-slate-200">Identity and compliance dashboard</p>
              </div>
            </div>

            <div className="max-w-3xl space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight text-slate-50 sm:text-5xl">{t("header.title")}</h1>
              <p className="max-w-2xl text-base leading-7 text-slate-200/85 sm:text-lg">{t("header.updated_now")}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800/70 bg-slate-950/45 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Identity</p>
                <p className="mt-3 text-sm leading-6 text-slate-200">Review personal info and public key in one place.</p>
              </div>
              <div className="rounded-2xl border border-slate-800/70 bg-slate-950/45 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">KYC</p>
                <p className="mt-3 text-sm leading-6 text-slate-200">Track document review, limits and progress.</p>
              </div>
              <div className="rounded-2xl border border-slate-800/70 bg-slate-950/45 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Privacy</p>
                <p className="mt-3 text-sm leading-6 text-slate-200">Keep control over documents, disclosures and support.</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/60 p-6 backdrop-blur-md">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Compliance</p>
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="text-xs text-slate-500">{t("kyc.title")}</div>
              <div className="mt-2 text-slate-100">{kyc.status}</div>
              <div className="mt-3"><Progress value={kyc.progressPct} className="mt-1" /></div>
              <div className="mt-2 text-xs text-slate-500">{kyc.progressPct}% • {t("kyc.next_step")}: {kyc.nextStep}</div>
            </div>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="text-slate-400 text-xs">{t("limits.current")}</div>
                <div className="mt-2 text-slate-100">R$ {kyc.limitCurrent.toLocaleString("en-US")}/month</div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="text-slate-400 text-xs">{t("limits.with_kyc")}</div>
                <div className="mt-2 text-slate-100">R$ {kyc.limitNext.toLocaleString("en-US")}</div>
              </div>
            </div>
          </div>
        </header>

        {/* User Identity */}
        <Card className="border-slate-800/70 bg-slate-950/60 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          <CardHeader>
            <CardTitle>{t("identity.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 overflow-hidden">
                  {user?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user?.avatarUrl || ""} alt="Avatar" className="w-14 h-14 rounded-full object-cover" />
                  ) : (
                    <span className="text-lg">{user?.nickname?.[0] ?? user?.name?.[0] ?? "?"}</span>
                  )}
                </div>
                <div>
                  <div className="text-slate-200 font-medium">{user?.name ?? "—"}</div>
                  <div className="text-xs text-slate-500">{t("identity.nickname")}: {user?.nickname ?? "—"}</div>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="text-slate-400">{t("identity.email")}</div>
                <div className="rounded-xl bg-slate-900/80 px-3 py-2 border border-slate-800">{user?.email ?? "—"}</div>
                <div className="text-slate-400 mt-2">{t("identity.phone")}</div>
                <div className="rounded-xl bg-slate-900/80 px-3 py-2 border border-slate-800">{user?.phone ?? "—"}</div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="text-slate-400">{t("identity.dob")}</div>
                <div className="rounded-xl bg-slate-900/80 px-3 py-2 border border-slate-800">{user?.dob ?? "—"} <span className="text-xs text-slate-500">{t("identity.dob_optional")}</span></div>
                <div className="text-slate-400 mt-2">{t("identity.public_key")}</div>
                <div className="rounded-xl bg-slate-900/80 px-3 py-2 border border-slate-800 text-xs break-all">{user?.publicKey ?? "—"}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status do KYC e AML */}
        <Card className="border-slate-800/70 bg-slate-950/60 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          <CardHeader>
            <CardTitle>{t("kyc.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <div className="text-xs text-slate-500">{t("kyc.status_label")}</div>
                <div className="text-slate-200">{kyc.status}</div>
                <div className="mt-2 text-xs text-slate-500">{t("kyc.level_label")}</div>
                <div className="text-slate-200">{kyc.level} <span className="text-xs text-slate-500">{t("kyc.limit_current", { value: kyc.limitCurrent.toLocaleString("en-US") })}</span></div>
              </div>
              <div>
                <div className="text-xs text-slate-500">{t("kyc.progress")}</div>
                <Progress value={kyc.progressPct} className="mt-1" />
                <div className="text-xs text-slate-500 mt-1">{kyc.progressPct}% • {t("kyc.next_step")}: {kyc.nextStep}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">{t("kyc.benefits_label")}</div>
                <div className="text-slate-200">{t("kyc.unlock_until", { value: kyc.limitNext.toLocaleString("en-US") })}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Upload and Validation */}
        <Card className="border-slate-800/70 bg-slate-950/60 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          <CardHeader>
            <CardTitle>{t("docs.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-slate-500 mb-3">{t("docs.accepted")}</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {documents.map((d) => (
                <div key={d.key} className="bg-slate-900/70 rounded-2xl p-3 text-sm border border-slate-800">
                  <div className="text-slate-300 font-medium">{d.label}</div>
                  <div className="text-xs text-slate-500 mt-1">{t("docs.status")}: {d.status}</div>
                  {d.preview ? (
                    <div className="mt-2 h-20 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs text-slate-500">{t("docs.preview")}</div>
                  ) : (
                    <div className="mt-2 h-20 rounded-xl bg-slate-800 border border-dashed border-slate-700 flex items-center justify-center text-xs text-slate-500">{t("docs.no_preview")}</div>
                  )}
                  <div className="mt-2 flex gap-2 flex-wrap">
                    <button disabled className="px-3 py-2 rounded-full bg-slate-800 text-slate-400 cursor-not-allowed" title={tc("soon")}>{t("docs.upload")}</button>
                    <button disabled className="px-3 py-2 rounded-full bg-slate-800 text-slate-400 cursor-not-allowed" title={tc("soon")}>{t("docs.view_example")}</button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions and Pending Steps */}
        <Card className="border-slate-800/70 bg-slate-950/60 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          <CardHeader>
            <CardTitle>{t("steps.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 text-sm space-y-1">
              {pendingSteps.map((s, i) => (
                <li key={i} className="text-slate-300">{s}</li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <button disabled className="px-3 py-2 rounded-full bg-slate-800 text-slate-400 cursor-not-allowed" title={tc("soon")}>{t("steps.start_continue")}</button>
              <button disabled className="px-3 py-2 rounded-full bg-slate-800 text-slate-400 cursor-not-allowed" title={tc("soon")}>{t("steps.review_personal")}</button>
            </div>
          </CardContent>
        </Card>

        {/* Submission History */}
        <Card className="border-slate-800/70 bg-slate-950/60 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          <CardHeader>
            <CardTitle>{t("history.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {history.map((h, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-900/70 rounded-xl px-3 py-2 border border-slate-800">
                  <div className="text-slate-300">{h.date} • {h.item}</div>
                  <div className="text-xs text-slate-400">{h.status}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Limits and Benefits */}
        <Card className="border-slate-800/70 bg-slate-950/60 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          <CardHeader>
            <CardTitle>{t("limits.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-900/70 rounded-2xl p-3 border border-slate-800">
                <div className="text-xs text-slate-500">{t("limits.current")}</div>
                <div className="text-lg font-semibold text-slate-200">R$ {kyc.limitCurrent.toLocaleString("en-US")}/month</div>
              </div>
              <div className="bg-slate-900/70 rounded-2xl p-3 border border-slate-800">
                <div className="text-xs text-slate-500">{t("limits.with_kyc")}</div>
                <div className="text-lg font-semibold text-slate-200">R$ {kyc.limitNext.toLocaleString("en-US")}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Policy and Security */}
        <Card className="border-slate-800/70 bg-slate-950/60 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          <CardHeader>
            <CardTitle>{t("privacy.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-slate-300">
              {t("privacy.text")}
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              <Link href="/docs" className="px-3 py-2 rounded-full border border-slate-700 bg-slate-900/80">{t("privacy.policy_full")}</Link>
              <span className="text-xs text-slate-500">{t("privacy.tip")}</span>
            </div>
          </CardContent>
        </Card>

        {/* Support & Help */}
        <Card className="border-slate-800/70 bg-slate-950/60 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          <CardHeader>
            <CardTitle>{t("support.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 text-sm">
              <Link href="/help" className="px-3 py-2 rounded-full border border-slate-700 bg-slate-900/80">{t("support.contact")}</Link>
              <Link href="/docs" className="px-3 py-2 rounded-full border border-slate-700 bg-slate-900/80">{t("support.faq")}</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

