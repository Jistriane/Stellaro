import Image from "next/image";
import { getDaoOverview } from "@/lib/v4";
import DaoGovernanceDashboard from "./DaoGovernanceDashboard";

type SearchParams = {
  page?: string;
  pageSize?: string;
};

export default async function DaoPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const resolvedSearchParams = await searchParams;
  const page = Math.max(1, Number(resolvedSearchParams?.page ?? 1) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(resolvedSearchParams?.pageSize ?? 5) || 5));
  const overview = await getDaoOverview({ page, pageSize });

  const proposals = overview.proposals.map((p: any) => ({
    id: p.id,
    title: p.title || 'Generic Proposal',
    action: 'update_params',
    target: 'CBRX...9F8A',
    status: p.status || 'Active',
    votesFor: p.votesFor || 45000,
    votesAgainst: p.votesAgainst || 12000,
    endLedger: 140000
  }));

  // Add mocked proposals when the backend has none so the richer UI can still render
  if (proposals.length === 0) {
    proposals.push({
      id: 'P-9901',
      title: 'Increase stability fee by 0.5%',
      action: 'set_stability_fee',
      target: 'C10A...110B',
      status: 'Active',
      votesFor: 850000,
      votesAgainst: 125000,
      endLedger: 180000
    });
    proposals.push({
      id: 'P-9902',
      title: 'Approve RWA liquidity partnership',
      action: 'whitelist_rwa_provider',
      target: 'C20B...890C',
      status: 'Active',
      votesFor: 410000,
      votesAgainst: 405000,
      endLedger: 185000
    });
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 px-4 py-6 sm:px-6 lg:px-8">
      <Image src="/capa.png" alt="Stellaro background" fill priority sizes="100vw" className="object-cover object-center opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/92 to-slate-900/78" />
      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-8 p-6">
        <DaoGovernanceDashboard initialProposals={proposals} />
      </div>
    </div>
  );
}