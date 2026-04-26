import ModuleLaunchPage from "@/components/ModuleLaunchPage";
import ModuleFilters from "@/components/ModuleFilters";
import ModulePagination from "@/components/ModulePagination";
import QuickCreateForm from "@/components/QuickCreateForm";
import { getRwaOverview } from "@/lib/v4";

type SearchParams = {
  page?: string;
  pageSize?: string;
  status?: string;
  assetClass?: string;
  search?: string;
};

export default async function RwaPage({ searchParams }: { searchParams?: SearchParams }) {
  const page = Math.max(1, Number(searchParams?.page ?? 1) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(searchParams?.pageSize ?? 5) || 5));
  const status = searchParams?.status?.trim() || undefined;
  const assetClass = searchParams?.assetClass?.trim() || undefined;
  const search = searchParams?.search?.trim() || undefined;

  const overview = await getRwaOverview({ page, pageSize, status, assetClass, search });

  return (
    <>
      <ModuleLaunchPage
      eyebrow="Módulo 1 / v4.0"
      title="Tokenização de Real World Assets"
      summary="Base visual para lançar ativos do mundo real com foco em documentos legais, listas de permissão e distribuição de rendimentos sem acoplar a lógica regulatória no frontend de consumo."
      status={overview.status}
      accent="from-amber-400/20 via-slate-900 to-slate-950"
      stats={[
        { label: "Fluxo principal", value: `${Math.round(overview.readiness * 100)}%`, hint: "A tela prepara onboarding, vitrine e estados regulatórios." },
        { label: "Entrega on-chain", value: "Selo + whitelist", hint: `Módulo: ${overview.module}` },
        { label: "Impacto do usuário", value: `${overview.total} ativos`, hint: `${overview.items.length} visíveis nesta página.` },
      ]}
      sections={[
        {
          title: "O que esta tela precisa suportar depois",
          items: ["Upload e resumo de documentos jurídicos", "Lista de emissores e ativos permitidos", "Timeline de rendimentos e eventos corporativos", "Integração com compliance-service e auditoria"],
        },
        {
          title: "Sinais de produto já presentes nos documentos",
          items: overview.nextSteps.length > 0 ? overview.nextSteps : ["Mercado de RWA com negociação P2P", "Registro de hash de documentos legais", "Distribuição de dividendos para holders", "Whitelist para ativos regulados"],
        },
      ]}
      links={[
        { href: "/v4", label: "Voltar ao launchpad" },
        { href: "/governance", label: "Abrir governança DAO" },
        { href: "/docs", label: "Ler os documentos" },
        { href: "https://developers.stellar.org/docs", label: "Stellar docs", external: true },
      ]}
      />
      <div className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">
        <ModuleFilters
          basePath="/rwa"
          pageSize={overview.pageSize}
          values={{ status, assetClass, search }}
          fields={[
            {
              name: "status",
              label: "Status",
              options: [
                { value: "scaffold", label: "Scaffold" },
                { value: "draft", label: "Draft" },
              ],
            },
            {
              name: "assetClass",
              label: "Classe do ativo",
              options: [
                { value: "real-estate", label: "Real estate" },
                { value: "receivables", label: "Receivables" },
              ],
            },
            { name: "search", label: "Busca", placeholder: "ID ou nome do ativo" },
          ]}
        />
        <ModulePagination
          basePath="/rwa"
          page={overview.page}
          pageSize={overview.pageSize}
          total={overview.total}
          query={{ status, assetClass, search }}
        />
        <QuickCreateForm
          title="Criar ativo RWA"
          description="Registra um novo ativo em memória para validar o fluxo do launchpad até o backend."
          endpoint="/rwa"
          fields={[
            { name: "name", label: "Nome do ativo", placeholder: "Receivables Basket 2026" },
            { name: "assetClass", label: "Classe do ativo", placeholder: "receivables" },
            { name: "annualYieldBps", label: "Yield anual (bps)", type: "number", placeholder: "920" },
          ]}
          submitLabel="Criar RWA"
        />
      </div>
    </>
  );
}