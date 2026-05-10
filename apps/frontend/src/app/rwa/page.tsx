import Image from "next/image";
import { getRwaOverview } from "@/lib/v4";
import RwaMarketplace from "./RwaMarketplace";

type SearchParams = {
  page?: string;
  pageSize?: string;
  status?: string;
  assetClass?: string;
  search?: string;
};

export default async function RwaPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const resolvedSearchParams = await searchParams;
  const page = Math.max(1, Number(resolvedSearchParams?.page ?? 1) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(resolvedSearchParams?.pageSize ?? 5) || 5));
  const status = resolvedSearchParams?.status?.trim() || undefined;
  const assetClass = resolvedSearchParams?.assetClass?.trim() || undefined;
  const search = resolvedSearchParams?.search?.trim() || undefined;

  const overview = await getRwaOverview({ page, pageSize, status, assetClass, search });

  // Map the backend items to the view required by RwaMarketplace
  const assets = overview.items.map((item: any) => ({
    id: item.id,
    name: item.name,
    assetClass: item.assetClass,
    status: item.status,
    whitelistRequired: item.whitelistRequired,
    annualYieldBps: item.annualYieldBps
  }));

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 px-4 py-6 sm:px-6 lg:px-8">
      <Image src="/capa.png" alt="Stellaro background" fill priority sizes="100vw" className="object-cover object-center opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/92 to-slate-900/78" />
      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-8 p-6">
        <RwaMarketplace initialAssets={assets} />
      </div>
    </div>
  );
}