import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type StatItem = {
  label: string;
  value: string;
  hint?: string;
};

type LinkItem = {
  href: string;
  label: string;
  external?: boolean;
};

type BulletSection = {
  title: string;
  items: string[];
};

type ModuleLaunchPageProps = {
  eyebrow: string;
  title: string;
  summary: string;
  status: string;
  accent?: string;
  contractId?: string;
  explorerUrl?: string;
  stats: StatItem[];
  sections: BulletSection[];
  links: LinkItem[];
};

export default function ModuleLaunchPage({
  eyebrow,
  title,
  summary,
  status,
  accent = "from-primary/15 via-background to-background",
  contractId,
  explorerUrl,
  stats,
  sections,
  links,
}: ModuleLaunchPageProps) {
  return (
    <div className="min-h-screen w-full bg-transparent text-foreground">
      <div className={`absolute inset-x-0 top-0 h-64 bg-gradient-to-b ${accent} opacity-80 pointer-events-none`} />

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-border/60 bg-card/50 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs uppercase tracking-[0.24em] text-muted-foreground">
            <span>{eyebrow}</span>
            <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-sans tracking-normal text-foreground">
              {status}
            </span>
          </div>
          <div className="mt-4 grid gap-6 lg:grid-cols-[1.4fr_0.8fr] lg:items-end">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">{summary}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-secondary/40 p-4">
              <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Integração principal</div>
              <div className="mt-2 break-all text-sm text-foreground">{contractId || "Contrato/serviço ainda não definido"}</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {explorerUrl ? (
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                  >
                    Ver no explorer
                  </a>
                ) : null}
                <Link
                  href="/docs"
                  className="rounded-full border border-border/70 bg-secondary/30 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-secondary/50"
                >
                  Abrir docs
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-border/60 bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-semibold text-foreground">{stat.value}</div>
                {stat.hint ? <div className="mt-1 text-xs leading-5 text-muted-foreground">{stat.hint}</div> : null}
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {sections.map((section) => (
            <Card key={section.title} className="border-border/60 bg-card/50">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {section.items.map((item) => (
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

        <section className="rounded-3xl border border-border/60 bg-card/50 p-6 backdrop-blur-xl">
          <div className="text-sm font-medium text-foreground">Próximas telas</div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noreferrer" : undefined}
                className="rounded-2xl border border-border/60 bg-secondary/30 px-4 py-4 text-sm text-foreground transition hover:border-primary/40 hover:bg-secondary/50"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
