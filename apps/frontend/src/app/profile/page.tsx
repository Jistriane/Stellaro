"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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

type KycDoc = {
  key: string;
  label: string;
  status: string;
};

type KycOverview = {
  status: string;
  progressPct: number;
  nextStep: string;
  level?: string;
  documents?: KycDoc[];
};

type KycHistoryItem = {
  id: string;
  status: string;
  provider: string;
  createdAt: string;
  updatedAt: string;
};

type KycFormState = {
  fullName: string;
  email: string;
  phone: string;
  dob: string;
  document: string;
  publicKey: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  revenue: string;
};

const EMPTY_OVERVIEW: KycOverview = {
  status: "Not started",
  progressPct: 0,
  nextStep: "Submit your KYC application",
  level: "Basic",
  documents: [],
};

export default function ProfilePage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const [user, setUser] = useState<UserProfile | null>(null);
  const [kycOverview, setKycOverview] = useState<KycOverview>(EMPTY_OVERVIEW);
  const [kycHistory, setKycHistory] = useState<KycHistoryItem[]>([]);

  const [kycForm, setKycForm] = useState<KycFormState>({
    fullName: "",
    email: "",
    phone: "",
    dob: "",
    document: "",
    publicKey: "",
    addressLine1: "",
    city: "",
    state: "",
    postalCode: "",
    country: "BR",
    revenue: "",
  });

  const [idDocumentFile, setIdDocumentFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [addressProofFile, setAddressProofFile] = useState<File | null>(null);
  const [revenueProofFile, setRevenueProofFile] = useState<File | null>(null);

  const [submittingKyc, setSubmittingKyc] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [authResolved, setAuthResolved] = useState(false);

  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useRealTimeUpdates({
    enabled: authResolved && !authRequired,
    suppressDisconnectedNotice: !authResolved || authRequired,
  });

  const syncUserIntoForm = (profile: UserProfile | null) => {
    setKycForm((prev) => ({
      ...prev,
      fullName: profile?.name ?? prev.fullName,
      email: profile?.email ?? prev.email,
      phone: profile?.phone ?? prev.phone,
      dob: profile?.dob ?? prev.dob,
      publicKey: profile?.publicKey ?? prev.publicKey,
    }));
  };

  const loadUser = async (): Promise<boolean> => {
    const res = await fetch(`${apiUrl}/auth/me`, { credentials: "include" });
    if (res.status === 401) {
      setAuthRequired(true);
      setUser(null);
      return false;
    }
    if (!res.ok) return false;
    const data = await res.json();
    const profile = (data?.user ?? null) as UserProfile | null;
    setUser(profile);
    syncUserIntoForm(profile);
    setAuthRequired(false);
    return true;
  };

  const loadKycOverview = async () => {
    setLoadingOverview(true);
    try {
      const res = await fetch(`${apiUrl}/compliance/kyc/me`, { credentials: "include" });
      if (!res.ok) {
        setKycOverview(EMPTY_OVERVIEW);
        return;
      }
      const data = await res.json();
      setKycOverview({
        status: data?.status || "Not started",
        progressPct: Number(data?.progressPct ?? 0),
        nextStep: data?.nextStep || "Submit your KYC application",
        level: data?.level || "Basic",
        documents: Array.isArray(data?.documents) ? data.documents : [],
      });
    } catch {
      setKycOverview(EMPTY_OVERVIEW);
    } finally {
      setLoadingOverview(false);
    }
  };

  const loadKycHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`${apiUrl}/compliance/kyc/history/me`, { credentials: "include" });
      if (!res.ok) {
        setKycHistory([]);
        return;
      }
      const data = await res.json();
      setKycHistory(Array.isArray(data?.items) ? data.items : []);
    } catch {
      setKycHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const authenticated = await loadUser();
        if (!authenticated) {
          setLoadingOverview(false);
          setLoadingHistory(false);
          setAuthResolved(true);
          return;
        }
        await Promise.all([loadKycOverview(), loadKycHistory()]);
        setAuthResolved(true);
      } finally {
        if (!active) return;
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const handleKycField = (field: keyof KycFormState, value: string) => {
    setKycForm((prev) => ({ ...prev, [field]: value }));
  };

  const requiredFilesReady = useMemo(
    () => Boolean(idDocumentFile && selfieFile && addressProofFile && revenueProofFile),
    [idDocumentFile, selfieFile, addressProofFile, revenueProofFile],
  );

  const handleKycSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (authRequired) {
      setSubmitError("Please sign in before submitting your KYC application.");
      setSubmitMessage(null);
      return;
    }

    if (!requiredFilesReady) {
      setSubmitError("Please upload all required files: ID, selfie, address proof, and revenue proof.");
      setSubmitMessage(null);
      return;
    }

    setSubmittingKyc(true);
    setSubmitError(null);
    setSubmitMessage(null);

    try {
      const formData = new FormData();
      formData.append("name", kycForm.fullName);
      formData.append("email", kycForm.email);
      formData.append("phone", kycForm.phone);
      formData.append("dob", kycForm.dob);
      formData.append("document", kycForm.document);
      formData.append("publicKey", kycForm.publicKey);
      formData.append("addressLine1", kycForm.addressLine1);
      formData.append("city", kycForm.city);
      formData.append("state", kycForm.state);
      formData.append("postalCode", kycForm.postalCode);
      formData.append("country", kycForm.country);
      formData.append("revenue", kycForm.revenue);
      formData.append("idDocument", idDocumentFile as File);
      formData.append("selfie", selfieFile as File);
      formData.append("addressProof", addressProofFile as File);
      formData.append("revenueProof", revenueProofFile as File);

      const response = await fetch(`${apiUrl}/compliance/kyc`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to submit KYC application.");
      }

      setSubmitMessage("KYC application submitted successfully. Your documents are now under review.");
      await Promise.all([loadKycOverview(), loadKycHistory()]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to submit KYC right now.";
      setSubmitError(message);
    } finally {
      setSubmittingKyc(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <Image
        src="/capa.png"
        alt="Stellaro background"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center opacity-25"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/92 to-background/75" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(var(--stellaro-accent-rgb),0.14),transparent_28%),radial-gradient(circle_at_82%_80%,rgba(197,135,230,0.10),transparent_24%)]" />

      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-8">
        {authRequired ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-secondary/20 px-4 py-3 text-sm text-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>You are not signed in. Sign in to load your profile, KYC status, and submission history.</span>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full border border-primary/30 bg-primary px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary-foreground transition hover:bg-primary/90"
            >
              Sign in now
            </Link>
          </div>
        ) : null}

        <header className="grid gap-6 rounded-[2rem] border border-border/60 bg-card/50 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 rounded-full border border-border/70 bg-card/40 px-4 py-2 backdrop-blur-sm">
              <Image src="/logo.png" alt="Stellaro logo" width={48} height={48} className="h-10 w-10 rounded-md object-contain" />
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.35em] text-muted-foreground">Profile</p>
                <p className="text-sm text-foreground">Identity and compliance workspace</p>
              </div>
            </div>

            <div className="max-w-3xl space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">Profile and KYC</h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Submit your identity, address, and income documentation to complete compliance verification.
              </p>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-border/40 bg-card/40 p-6 backdrop-blur-md">
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-muted-foreground">Compliance Status</p>
            <div className="mt-4 rounded-2xl border border-border/60 bg-secondary/20 p-4">
              <div className="text-xs text-muted-foreground">Current status</div>
              <div className="mt-2 text-foreground">{loadingOverview ? "Loading..." : kycOverview.status}</div>
              <div className="mt-3"><Progress value={kycOverview.progressPct} className="mt-1" /></div>
              <div className="mt-2 text-xs text-muted-foreground">{kycOverview.progressPct}% • Next step: {kycOverview.nextStep}</div>
            </div>
            <div className="mt-4 rounded-2xl border border-border/60 bg-secondary/20 p-4 text-sm">
              <div className="text-muted-foreground text-xs">Verification level</div>
              <div className="mt-2 text-foreground">{kycOverview.level || "Basic"}</div>
            </div>
          </div>
        </header>

        <Card className="border-border/60 bg-card/50 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          <CardHeader>
            <CardTitle>Identity information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-secondary/20 border border-border/60 flex items-center justify-center text-muted-foreground overflow-hidden">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" className="w-14 h-14 rounded-full object-cover" />
                  ) : (
                    <span className="text-lg">{user?.nickname?.[0] ?? user?.name?.[0] ?? "?"}</span>
                  )}
                </div>
                <div>
                  <div className="text-foreground font-medium">{user?.name ?? "Not available"}</div>
                  <div className="text-xs text-muted-foreground">Nickname: {user?.nickname ?? "Not available"}</div>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="text-muted-foreground">Email</div>
                <div className="rounded-xl bg-secondary/20 px-3 py-2 border border-border/60 text-foreground">{user?.email ?? "Not available"}</div>
                <div className="text-muted-foreground mt-2">Phone</div>
                <div className="rounded-xl bg-secondary/20 px-3 py-2 border border-border/60 text-foreground">{user?.phone ?? "Not available"}</div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="text-muted-foreground">Date of birth</div>
                <div className="rounded-xl bg-secondary/20 px-3 py-2 border border-border/60 text-foreground">{user?.dob ?? "Not available"}</div>
                <div className="text-muted-foreground mt-2">Stellar public key</div>
                <div className="rounded-xl bg-secondary/20 px-3 py-2 border border-border/60 text-xs break-all text-foreground">{user?.publicKey ?? "Not available"}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/50 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          <CardHeader>
            <CardTitle>KYC application form</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleKycSubmit} className="space-y-5">
              <div className="text-xs text-muted-foreground">
                Provide all requested personal and financial information and upload every required file.
              </div>

              {submitError ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {submitError}
                </div>
              ) : null}

              {submitMessage ? (
                <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">
                  {submitMessage}
                </div>
              ) : null}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <label className="space-y-2">
                  <span className="text-muted-foreground">Full name</span>
                  <input className="w-full rounded-xl border border-border/60 bg-secondary/30 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60" value={kycForm.fullName} onChange={(e) => handleKycField("fullName", e.target.value)} required />
                </label>
                <label className="space-y-2">
                  <span className="text-muted-foreground">Email</span>
                  <input type="email" className="w-full rounded-xl border border-border/60 bg-secondary/30 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60" value={kycForm.email} onChange={(e) => handleKycField("email", e.target.value)} required />
                </label>
                <label className="space-y-2">
                  <span className="text-muted-foreground">Phone</span>
                  <input className="w-full rounded-xl border border-border/60 bg-secondary/30 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60" value={kycForm.phone} onChange={(e) => handleKycField("phone", e.target.value)} required />
                </label>
                <label className="space-y-2">
                  <span className="text-muted-foreground">Date of birth</span>
                  <input type="date" className="w-full rounded-xl border border-border/60 bg-secondary/30 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60" value={kycForm.dob} onChange={(e) => handleKycField("dob", e.target.value)} required />
                </label>
                <label className="space-y-2">
                  <span className="text-muted-foreground">Document (CPF or CNPJ)</span>
                  <input className="w-full rounded-xl border border-border/60 bg-secondary/30 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60" value={kycForm.document} onChange={(e) => handleKycField("document", e.target.value)} required />
                </label>
                <label className="space-y-2">
                  <span className="text-muted-foreground">Stellar wallet public key</span>
                  <input className="w-full rounded-xl border border-border/60 bg-secondary/30 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60" value={kycForm.publicKey} onChange={(e) => handleKycField("publicKey", e.target.value)} required />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-muted-foreground">Full address</span>
                  <input className="w-full rounded-xl border border-border/60 bg-secondary/30 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60" value={kycForm.addressLine1} onChange={(e) => handleKycField("addressLine1", e.target.value)} required />
                </label>
                <label className="space-y-2">
                  <span className="text-muted-foreground">City</span>
                  <input className="w-full rounded-xl border border-border/60 bg-secondary/30 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60" value={kycForm.city} onChange={(e) => handleKycField("city", e.target.value)} required />
                </label>
                <label className="space-y-2">
                  <span className="text-muted-foreground">State</span>
                  <input className="w-full rounded-xl border border-border/60 bg-secondary/30 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60" value={kycForm.state} onChange={(e) => handleKycField("state", e.target.value)} required />
                </label>
                <label className="space-y-2">
                  <span className="text-muted-foreground">Postal code</span>
                  <input className="w-full rounded-xl border border-border/60 bg-secondary/30 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60" value={kycForm.postalCode} onChange={(e) => handleKycField("postalCode", e.target.value)} required />
                </label>
                <label className="space-y-2">
                  <span className="text-muted-foreground">Country</span>
                  <input className="w-full rounded-xl border border-border/60 bg-secondary/30 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60" value={kycForm.country} onChange={(e) => handleKycField("country", e.target.value)} required />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-muted-foreground">Monthly revenue</span>
                  <input className="w-full rounded-xl border border-border/60 bg-secondary/30 px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60" value={kycForm.revenue} onChange={(e) => handleKycField("revenue", e.target.value)} required />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <label className="space-y-2">
                  <span className="text-muted-foreground">Upload ID document</span>
                  <input type="file" accept="image/*,.pdf" className="w-full rounded-xl border border-border/60 bg-secondary/30 px-3 py-2 text-foreground" onChange={(e) => setIdDocumentFile(e.target.files?.[0] ?? null)} required />
                </label>
                <label className="space-y-2">
                  <span className="text-muted-foreground">Upload selfie</span>
                  <input type="file" accept="image/*" className="w-full rounded-xl border border-border/60 bg-secondary/30 px-3 py-2 text-foreground" onChange={(e) => setSelfieFile(e.target.files?.[0] ?? null)} required />
                </label>
                <label className="space-y-2">
                  <span className="text-muted-foreground">Upload address proof</span>
                  <input type="file" accept="image/*,.pdf" className="w-full rounded-xl border border-border/60 bg-secondary/30 px-3 py-2 text-foreground" onChange={(e) => setAddressProofFile(e.target.files?.[0] ?? null)} required />
                </label>
                <label className="space-y-2">
                  <span className="text-muted-foreground">Upload revenue proof</span>
                  <input type="file" accept="image/*,.pdf" className="w-full rounded-xl border border-border/60 bg-secondary/30 px-3 py-2 text-foreground" onChange={(e) => setRevenueProofFile(e.target.files?.[0] ?? null)} required />
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingKyc}
                  className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-wait disabled:opacity-70"
                >
                  {submittingKyc ? "Submitting KYC..." : "Submit profile and documents"}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/50 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          <CardHeader>
            <CardTitle>Documents status</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingOverview ? (
              <div className="text-sm text-muted-foreground">Loading document status...</div>
            ) : (kycOverview.documents?.length ?? 0) === 0 ? (
              <div className="text-sm text-muted-foreground">No documents submitted yet.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {(kycOverview.documents ?? []).map((d) => (
                  <div key={d.key} className="bg-secondary/20 rounded-2xl p-3 text-sm border border-border/60">
                    <div className="text-foreground font-medium">{d.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">Status: {d.status}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/50 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          <CardHeader>
            <CardTitle>KYC submission history</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingHistory ? (
              <div className="text-sm text-muted-foreground">Loading KYC history...</div>
            ) : kycHistory.length === 0 ? (
              <div className="text-sm text-muted-foreground">No KYC submissions found.</div>
            ) : (
              <div className="space-y-2 text-sm">
                {kycHistory.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-secondary/20 rounded-xl px-3 py-2 border border-border/60">
                    <div className="text-foreground">
                      {new Date(item.createdAt).toLocaleString("en-US")} • {item.provider}
                    </div>
                    <div className="text-xs text-muted-foreground">{item.status}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/50 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
          <CardHeader>
            <CardTitle>Privacy and support</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Your uploaded files are used for compliance verification and secure account operations.
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <Link href="/docs" className="px-3 py-2 rounded-full border border-border/60 bg-secondary/20 text-foreground">Documentation</Link>
              <Link href="/help" className="px-3 py-2 rounded-full border border-border/60 bg-secondary/20 text-foreground">Support</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
