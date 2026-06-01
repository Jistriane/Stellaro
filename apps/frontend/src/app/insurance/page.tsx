import Image from "next/image";
import ModuleLaunchPage from "@/components/ModuleLaunchPage";

export default async function InsurancePage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <Image src="/capa.png" alt="Stellaro background" fill priority sizes="100vw" className="object-cover object-center opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/92 to-background/75" />
      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-8 p-6">
        <ModuleLaunchPage
        eyebrow="Module 4 / v4.0"
        title="Insurance Pool"
        summary="Decentralized insurance pool for protection against systemic risks and claims in RWAs."
        status="integrated-with-soroban"
        accent="from-primary/15 via-background to-background"
        stats={[
          { label: "Function", value: "Risk Coverage", hint: "Automatic claims settlement via governance." },
          { label: "Asset", value: "Stellar Asset (STLT)", hint: "Collateralized deposits in the pool." },
          { label: "Readiness", value: "80%", hint: "Contrato inteligente e backend integrados." },
        ]}
        sections={[
          {
            title: "Pool Capabilities",
            items: ["Liquidity deposit (LP)", "Proportional share withdrawal", "DAO settlement", "On-chain auditing"],
          },
        ]}
        links={[
          { href: "/v4", label: "Back to launchpad" },
          { href: "/docs", label: "View actuarial model" },
        ]}
      />
        <div className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-border/60 bg-secondary/10 p-4 text-sm text-muted-foreground">
            Depósitos no pool de seguro estão desabilitados via API para evitar envio de Secret Key em produção.
            O fluxo correto é assinatura via wallet (Freighter / mobile wallet) e submissão on-chain.
          </div>
        </div>
      </div>
    </div>
  );
}
