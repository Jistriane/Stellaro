import ModuleLaunchPage from "@/components/ModuleLaunchPage";
import ModuleFilters from "@/components/ModuleFilters";
import ModulePagination from "@/components/ModulePagination";
import QuickCreateForm from "@/components/QuickCreateForm";
import { getSsiOverview } from "@/lib/v4";

type SearchParams = {
  page?: string;
  pageSize?: string;
  status?: string;
  type?: string;
  search?: string;
};

export default async function SsiPage({ searchParams }: { searchParams?: SearchParams }) {
  const page = Math.max(1, Number(searchParams?.page ?? 1) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(searchParams?.pageSize ?? 5) || 5));
  const status = searchParams?.status?.trim() || undefined;
  const type = searchParams?.type?.trim() || undefined;
  const search = searchParams?.search?.trim() || undefined;

  const overview = await getSsiOverview({ page, pageSize, status, type, search });

  return (
    <>
      <ModuleLaunchPage
      eyebrow="Módulo 2 / v4.0"
      title="SSI / Verifiable Credentials"
      summary="Espaço para a wallet de credenciais verificáveis, com apresentação seletiva de atributos e revogação sem expor dados desnecessários ao ecossistema."
      status={overview.status}
      accent="from-sky-400/20 via-slate-900 to-slate-950"
      stats={[
        { label: "Estado da UX", value: `${overview.total} credenciais`, hint: `${overview.credentials.length} visíveis nesta página.` },
        { label: "Modelo de confiança", value: "Selective disclosure", hint: `Módulo: ${overview.module}` },
        { label: "Ação crítica", value: `${Math.round(overview.readiness * 100)}%`, hint: "Precisamos tratar expiração, revogação e replay como estados explícitos." },
      ]}
      sections={[
        {
          title: "Fluxos previstos",
          items: ["Emitir uma credencial a partir de um provedor autorizado", "Armazenar credenciais com metadados e status", "Apresentar somente os atributos necessários", "Consultar histórico de apresentação"],
        },
        {
          title: "Integrações futuras",
          items: overview.nextSteps.length > 0 ? overview.nextSteps : ["VC Registry on-chain", "Serviço de emissão e revogação", "KYC/AML com privacidade", "Monitoramento de expiração e status"],
        },
      ]}
      links={[
        { href: "/v4", label: "Voltar ao launchpad" },
        { href: "/profile", label: "Abrir perfil" },
        { href: "/settings/advanced", label: "Sessões e segurança" },
        { href: "/docs", label: "Documentação do produto" },
      ]}
      />
      <div className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">
        <ModuleFilters
          basePath="/ssi"
          pageSize={overview.pageSize}
          values={{ status, type, search }}
          fields={[
            {
              name: "status",
              label: "Status",
              options: [
                { value: "active", label: "Active" },
                { value: "revocation-ready", label: "Revocation ready" },
              ],
            },
            { name: "type", label: "Tipo", placeholder: "KYCVerified" },
            { name: "search", label: "Busca", placeholder: "ID, tipo ou emissor" },
          ]}
        />
        <ModulePagination
          basePath="/ssi"
          page={overview.page}
          pageSize={overview.pageSize}
          total={overview.total}
          query={{ status, type, search }}
        />
        <QuickCreateForm
          title="Emitir credencial"
          description="Gera uma credencial em memória para simular emissão e apresentação seletiva."
          endpoint="/ssi"
          fields={[
            { name: "type", label: "Tipo de credencial", placeholder: "ProofOfAddress" },
            { name: "issuer", label: "Emissor", placeholder: "stellaro-identity" },
          ]}
          submitLabel="Emitir VC"
        />
      </div>
    </>
  );
}