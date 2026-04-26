import ModuleLaunchPage from "@/components/ModuleLaunchPage";
import QuickCreateForm from "@/components/QuickCreateForm";

export default async function InsurancePage() {
  return (
    <>
      <ModuleLaunchPage
        eyebrow="Módulo 4 / v4.0"
        title="Insurance Pool"
        summary="Pool de seguros descentralizado para proteção contra riscos sistêmicos e sinistros em RWAs."
        status="integrated-with-soroban"
        accent="from-rose-400/20 via-slate-900 to-slate-950"
        stats={[
          { label: "Função", value: "Cobertura de Risco", hint: "Liquidação automática de sinistros via governança." },
          { label: "Ativo", value: "Stellar Asset (STLT)", hint: "Depósitos colateralizados no pool." },
          { label: "Readiness", value: "80%", hint: "Contrato inteligente e backend integrados." },
        ]}
        sections={[
          {
            title: "Capacidades do Pool",
            items: ["Depósito de liquidez (LP)", "Saque proporcional à share", "Liquidação por DAO", "Auditoria on-chain"],
          },
        ]}
        links={[
          { href: "/v4", label: "Voltar ao launchpad" },
          { href: "/docs", label: "Ver modelo atuarial" },
        ]}
      />
      <div className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">
        <QuickCreateForm
          title="Depositar no Pool de Seguros"
          description="Aumente a colateralização do protocolo Stellaro e receba shares de cobertura."
          endpoint="/insurance/deposit"
          fields={[
            { name: "amount", label: "Quantidade (STLT)", placeholder: "100.00" },
            { name: "userSecret", label: "Sua Secret Key (Teste)", placeholder: "S..." },
          ]}
          submitLabel="Depositar"
        />
      </div>
    </>
  );
}
