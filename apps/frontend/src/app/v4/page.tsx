import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getV4Overview } from "@/lib/v4";

export default async function V4LandingPage() {
  const overview = await getV4Overview();

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <Image src="/capa.png" alt="Stellaro background" fill priority sizes="100vw" className="object-cover object-center opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/92 to-background/75" />
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-primary/20 bg-card/50 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="font-mono text-xs uppercase tracking-[0.28em] text-primary">Stellaro v4.0</div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">Launchpad for the modules that were still missing from the strategic vision</h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
            This surface brings the new flows described in the project documents into a concrete navigation: RWA tokenization, verifiable credentials, recurring payments, and DAO governance.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-secondary/30 p-4">
              <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Readiness</div>
              <div className="mt-2 text-2xl font-semibold text-foreground">{Math.round(overview.readiness * 100)}%</div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-secondary/30 p-4">
              <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Status</div>
              <div className="mt-2 text-sm text-foreground">{overview.status}</div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-secondary/30 p-4">
              <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Modules</div>
              <div className="mt-2 text-2xl font-semibold text-foreground">{overview.modules.length}</div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <Link href="/" className="rounded-full bg-primary px-4 py-2 font-medium text-primary-foreground transition hover:bg-primary/90">
              Back to home
            </Link>
            <Link href="/docs" className="rounded-full border border-border/60 bg-secondary/20 px-4 py-2 font-medium text-foreground transition hover:bg-secondary/40">
              Read documentation
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {overview.modules.map((module) => (
            <Card key={module.href} className="border-border/60 bg-card/50">
              <CardHeader>
                <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">{module.status}</div>
                <CardTitle className="text-lg text-foreground">{module.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-6 text-muted-foreground">{module.items} items in the backend, readiness {Math.round(module.readiness * 100)}%.</p>
                <Link href={module.href} className="inline-flex rounded-full border border-border/60 bg-secondary/20 px-4 py-2 text-sm text-foreground transition hover:border-primary/40 hover:bg-secondary/40">
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
            <Card key={panel.title} className="border-border/60 bg-card/50">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">{panel.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {panel.items.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                      <span className="text-foreground">{item}</span>
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
