import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getV4Overview } from "@/lib/v4";

export default async function V4LandingPage() {
  const overview = await getV4Overview();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_35%),linear-gradient(180deg,#020617_0%,#020617_100%)] text-slate-100">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-emerald-400/20 bg-slate-950/80 p-8 shadow-2xl shadow-black/30 backdrop-blur">
          <div className="text-xs uppercase tracking-[0.28em] text-emerald-300">Stellaro v4.0</div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">Launchpad dos módulos que ainda faltavam na visão estratégica</h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
            Esta superfície junta os novos fluxos descritos nos documentos do projeto em uma navegação concreta: tokenização de RWA, credenciais verificáveis, pagamentos recorrentes e governança DAO.
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
              <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Módulos</div>
              <div className="mt-2 text-2xl font-semibold text-white">{overview.modules.length}</div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <Link href="/" className="rounded-full bg-emerald-400 px-4 py-2 font-medium text-slate-950 transition hover:bg-emerald-300">
              Voltar para a home
            </Link>
            <Link href="/docs" className="rounded-full border border-slate-700 px-4 py-2 font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-900">
              Ler documentação
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
                <p className="text-sm leading-6 text-slate-400">{module.items} itens no backend, readiness {Math.round(module.readiness * 100)}%.</p>
                <Link href={module.href} className="inline-flex rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-emerald-400/40 hover:bg-slate-900">
                  Abrir módulo
                </Link>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          {[
            {
              title: "Sequência sugerida",
              items: ["1. RWA como primeiro módulo regulado", "2. SSI para suporte de KYC/AML com privacidade", "3. Recurring payments para monetização recorrente", "4. DAO como camada final de governança"],
            },
            {
              title: "Dependências críticas",
              items: ["Contratos Soroban configuráveis", "Backend para estados e auditoria", "Observabilidade e smoke tests", "Upgrade path sem quebrar os contratos antigos"],
            },
            {
              title: "Resultado esperado",
              items: overview.nextSteps.length > 0 ? overview.nextSteps.slice(0, 4) : ["Rotas reais no frontend", "Exploração guiada do produto", "Base pronta para API e contratos v4", "Ponto único para continuar a construção"],
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