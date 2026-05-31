import Image from "next/image";
import { getSubscriptionOverview } from "@/lib/v4";
import RecurringPaymentsDashboard from "./RecurringPaymentsDashboard";

export default async function RecurringPaymentsPage() {
  const page = 1;
  const pageSize = 5;
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
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-transparent px-4 py-6 sm:px-6 lg:px-8">
      <Image src="/capa.png" alt="Stellaro background" fill priority sizes="100vw" className="object-cover object-center opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/92 to-background/75" />
      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-8 p-6">
        <RecurringPaymentsDashboard initialSubscriptions={subscriptions} />
      </div>
    </div>
  );
}
