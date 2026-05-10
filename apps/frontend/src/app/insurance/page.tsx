import Image from "next/image";
import ModuleLaunchPage from "@/components/ModuleLaunchPage";
import QuickCreateForm from "@/components/QuickCreateForm";

export default async function InsurancePage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 px-4 py-6 sm:px-6 lg:px-8">
      <Image src="/capa.png" alt="Stellaro background" fill priority sizes="100vw" className="object-cover object-center opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/92 to-slate-900/78" />
      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-8 p-6">
        <ModuleLaunchPage
        eyebrow="Module 4 / v4.0"
        title="Insurance Pool"
        summary="Decentralized insurance pool for protection against systemic risks and claims in RWAs."
        status="integrated-with-soroban"
        accent="from-rose-400/20 via-slate-900 to-slate-950"
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
        <QuickCreateForm
          title="Deposit into the Insurance Pool"
          description="Increase Stellaro protocol collateralization and receive coverage shares."
          endpoint="/insurance/deposit"
          fields={[
            { name: "amount", label: "Amount (STLT)", placeholder: "100.00" },
            { name: "userSecret", label: "Your Secret Key (Test)", placeholder: "S..." },
          ]}
          submitLabel="Deposit"
        />
        </div>
      </div>
    </div>
  );
}
