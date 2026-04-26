import ModuleLaunchPage from "@/components/ModuleLaunchPage";
import ModulePagination from "@/components/ModulePagination";
import QuickCreateForm from "@/components/QuickCreateForm";
import { getDaoOverview } from "@/lib/v4";

type SearchParams = {
  page?: string;
  pageSize?: string;
};

export default async function DaoPage({ searchParams }: { searchParams?: SearchParams }) {
  const page = Math.max(1, Number(searchParams?.page ?? 1) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(searchParams?.pageSize ?? 5) || 5));
  const overview = await getDaoOverview({ page, pageSize });

  return (
    <>
      <ModuleLaunchPage
      eyebrow="Módulo 4 / v4.0"
      title="DAO Governance"
      summary="Entrada dedicada para a governança do protocolo. A página separa a visão estratégica de DAO do painel operacional existente em governance."
      status={overview.status}
      accent="from-violet-400/20 via-slate-900 to-slate-950"
      stats={[
        { label: "Função", value: "Governança do protocolo", hint: "Propostas, votação, quórum e timelock." },
        { label: "Integração de produto", value: `${overview.total} propostas`, hint: `${overview.proposals.length} visíveis nesta página.` },
        { label: "Estado atual", value: `${Math.round(overview.readiness * 100)}%`, hint: `Módulo: ${overview.module}` },
      ]}
      sections={[
        {
          title: "Capacidades previstas",
          items: ["Lista de propostas em aberto", "Votação com peso de token", "Timelock de execução", "Registro de decisões em contrato e backend"],
        },
        {
          title: "Onde o usuário continua",
          items: overview.nextSteps.length > 0 ? overview.nextSteps : ["Ver o painel detalhado em governance", "Abrir o histórico de votação", "Acompanhar propostas em andamento", "Inspecionar decisões em explorer"],
        },
      ]}
      links={[
        { href: "/governance", label: "Abrir painel detalhado" },
        { href: "/v4", label: "Voltar ao launchpad" },
        { href: "/dao", label: "Recarregar rota" },
        { href: "/docs", label: "Documentação do projeto" },
      ]}
      />
      <div className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">
        <ModulePagination basePath="/dao" page={overview.page} pageSize={overview.pageSize} total={overview.total} />
        <QuickCreateForm
          title="Criar proposta DAO"
          description="Abre uma proposta em memória para testar o caminho de governança da nova rota DAO."
          endpoint="/dao"
          fields={[
            { name: "title", label: "Título da proposta", placeholder: "Launch RWA whitelist controls" },
            { name: "quorumBps", label: "Quórum (bps)", type: "number", placeholder: "2500" },
            { name: "timelockHours", label: "Timelock (h)", type: "number", placeholder: "24" },
          ]}
          submitLabel="Criar proposta"
        />
      </div>
    </>
  );
}