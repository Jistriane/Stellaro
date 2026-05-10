import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getV4Overview } from "@/lib/v4";

export default async function V4LandingPage() {
  const overview = await getV4Overview();

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 px-4 py-6 sm:px-6 lg:px-8">
      <Image src="/capa.png" alt="Stellaro background" fill priority sizes="100vw" className="object-cover object-center opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/92 to-slate-900/78" />
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-emerald-400/20 bg-slate-950/80 p-8 shadow-2xl shadow-black/30 backdrop-blur">
          <div className="text-xs uppercase tracking-[0.28em] text-emerald-300">Stellaro v4.0</div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">Launchpad for the modules that were still missing from the strategic vision</h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
            This surface brings the new flows described in the project documents into a concrete navigation: RWA tokenization, verifiable credentials, recurring payments, and DAO governance.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Readiness</div>
              <div className="mt-2 text-2xl font-semibold text-white">{Math.round(overview.readiness * 100)}%</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Status</div>
              <div className="mt-2 text-sm text-slate-100">{overview.status}</div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Modules</div>
              <div className="mt-2 text-2xl font-semibold text-white">{overview.modules.length}</div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <Link href="/" className="rounded-full bg-emerald-400 px-4 py-2 font-medium text-slate-950 transition hover:bg-emerald-300">
              Back to home
            </Link>
            <Link href="/docs" className="rounded-full border border-slate-700 px-4 py-2 font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-900">
              Read documentation
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {overview.modules.map((module) => (
            <Card key={module.href} className="border-slate-800 bg-slate-950/80">
              <CardHeader>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{module.status}</div>
                <CardTitle className="text-lg text-slate-100">{module.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-6 text-slate-400">{module.items} items in the backend, readiness {Math.round(module.readiness * 100)}%.</p>
                <Link href={module.href} className="inline-flex rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-emerald-400/40 hover:bg-slate-900">
                  Open module
                </Link>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {[
            {
              title: "Suggested sequence",
              items: ["1. RWA as the first regulated module", "2. SSI for privacy-preserving KYC/AML support", "3. Recurring payments for recurring monetization", "4. DAO as the final governance layer"],
            },
            {
              title: "Critical dependencies",
              items: ["Configurable Soroban contracts", "Backend for state and auditing", "Observability and smoke tests", "Upgrade path without breaking legacy contracts"],
            },
            {
              title: "Expected outcome",
              items: overview.nextSteps.length > 0 ? overview.nextSteps.slice(0, 4) : ["Real frontend routes", "Guided product exploration", "Base ready for API and v4 contracts", "Single entry point to keep building"],
            },
          ].map((panel) => (
            <Card key={panel.title} className="border-slate-800 bg-slate-950/80">
              <CardHeader>
                <CardTitle className="text-lg text-slate-100">{panel.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-300">
                  {panel.items.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>
    </div>
  );
}