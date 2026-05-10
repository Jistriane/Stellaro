import Image from "next/image";
import { getSubscriptionOverview } from "@/lib/v4";
import RecurringPaymentsDashboard from "./RecurringPaymentsDashboard";

type SearchParams = {
  page?: string;
  pageSize?: string;
};

export default async function RecurringPaymentsPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const resolvedSearchParams = await searchParams;
  const page = Math.max(1, Number(resolvedSearchParams?.page ?? 1) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(resolvedSearchParams?.pageSize ?? 5) || 5));
  const overview = await getSubscriptionOverview({ page, pageSize });

  const subscriptions = overview.plans.map((p: any) => ({
    id: p.id,
    name: p.name,
    amount: p.amount || 25,
    currency: p.currency || 'STLT',
    cadence: p.cadence || 'monthly',
    status: p.status || 'active',
    nextBilling: new Date(Date.now() + 86400000 * 15).toISOString()
  }));

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 px-4 py-6 sm:px-6 lg:px-8">
      <Image src="/capa.png" alt="Stellaro background" fill priority sizes="100vw" className="object-cover object-center opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/92 to-slate-900/78" />
      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-8 p-6">
        <RecurringPaymentsDashboard initialSubscriptions={subscriptions} />
      </div>
    </div>
  );
}