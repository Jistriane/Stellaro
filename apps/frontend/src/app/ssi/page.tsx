import Image from "next/image";
import { getSsiOverview } from "@/lib/v4";
import SsiWallet from "./SsiWallet";

type SearchParams = {
  page?: string;
  pageSize?: string;
  status?: string;
  type?: string;
  search?: string;
};

export default async function SsiPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const resolvedSearchParams = await searchParams;
  const page = Math.max(1, Number(resolvedSearchParams?.page ?? 1) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(resolvedSearchParams?.pageSize ?? 5) || 5));
  const status = resolvedSearchParams?.status?.trim() || undefined;
  const type = resolvedSearchParams?.type?.trim() || undefined;
  const search = resolvedSearchParams?.search?.trim() || undefined;

  const overview = await getSsiOverview({ page, pageSize, status, type, search });

  // Map the backend credentials to the format expected by SsiWallet
  const credentials = (overview.credentials || []).map((cred: any, index: number) => ({
    id: cred.id || `vc-${index + 1}`,
    type: cred.type || 'VerifiableCredential',
    issuer: cred.issuer || 'Unknown Issuer',
    status: cred.status || 'active',
    issuedAt: cred.createdAt || new Date().toISOString()
  }));

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 px-4 py-6 sm:px-6 lg:px-8">
      <Image src="/capa.png" alt="Stellaro background" fill priority sizes="100vw" className="object-cover object-center opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/92 to-slate-900/78" />
      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-8 p-6">
        <SsiWallet initialCredentials={credentials} />
      </div>
    </div>
  );
}