import Image from "next/image";
import { getRwaOverview } from "@/lib/v4";
import RwaMarketplace from "./RwaMarketplace";

export default async function RwaPage() {
  const page = 1;
  const pageSize = 5;
  const status = undefined;
  const assetClass = undefined;
  const search = undefined;

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
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <Image src="/capa.png" alt="Stellaro background" fill priority sizes="100vw" className="object-cover object-center opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/92 to-background/75" />
      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-8 p-6">
        <RwaMarketplace initialAssets={assets} />
      </div>
    </div>
  );
}
