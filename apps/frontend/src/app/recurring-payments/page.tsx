import ModuleLaunchPage from "@/components/ModuleLaunchPage";
import ModulePagination from "@/components/ModulePagination";
import QuickCreateForm from "@/components/QuickCreateForm";
import { getSubscriptionOverview } from "@/lib/v4";

type SearchParams = {
  page?: string;
  pageSize?: string;
};

export default async function RecurringPaymentsPage({ searchParams }: { searchParams?: SearchParams }) {
  const page = Math.max(1, Number(searchParams?.page ?? 1) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(searchParams?.pageSize ?? 5) || 5));
  const overview = await getSubscriptionOverview({ page, pageSize });

  return (
    <>
      <ModuleLaunchPage
      eyebrow="Módulo 3 / v4.0"
      title="Pagamentos recorrentes em stablecoin"
      summary="Tela inicial para assinaturas, cobranças agendadas e histórico de recorrência com trilha clara de autorização e cancelamento."
      status={overview.status}
      accent="from-cyan-400/20 via-slate-900 to-slate-950"
      stats={[
        { label: "Uso principal", value: `${overview.total} planos`, hint: `${overview.plans.length} visíveis nesta página.` },
        { label: "Risco controlado", value: "Idempotência", hint: `Módulo: ${overview.module}` },
        { label: "Execução", value: `${Math.round(overview.readiness * 100)}%`, hint: "Os contratos e jobs ficam para a próxima camada da implementação." },
      ]}
      sections={[
        {
          title: "O que esta tela deve resolver",
          items: ["Criar uma assinatura com periodicidade e limite", "Exibir próxima data de cobrança e status", "Cancelar ou pausar recorrência", "Mostrar comprovantes e eventos de auditoria"],
        },
        {
          title: "Dependências de produto",
          items: overview.nextSteps.length > 0 ? overview.nextSteps : ["Subscription Manager contract", "Backend de agendamento e retry", "Webhook de confirmação de pagamento", "Histórico e notificações em tempo real"],
        },
      ]}
      links={[
        { href: "/v4", label: "Voltar ao launchpad" },
        { href: "/pix", label: "Abrir PIX" },
        { href: "/wallet", label: "Abrir wallet" },
        { href: "/docs", label: "Ler a visão geral" },
      ]}
      />
      <div className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">
        <ModulePagination basePath="/recurring-payments" page={overview.page} pageSize={overview.pageSize} total={overview.total} />
        <QuickCreateForm
          title="Criar assinatura"
          description="Cria uma assinatura em memória para validar o fluxo de recorrência com um passo real de UI."
          endpoint="/subscriptions"
          fields={[
            { name: "name", label: "Nome do plano", placeholder: "Monthly Membership" },
            { name: "cadence", label: "Cadência", placeholder: "monthly" },
            { name: "amount", label: "Valor", placeholder: "25.00" },
            { name: "currency", label: "Moeda", placeholder: "STLT" },
          ]}
          submitLabel="Criar plano"
        />
      </div>
    </>
  );
}