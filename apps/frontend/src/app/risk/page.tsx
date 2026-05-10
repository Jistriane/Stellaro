import Image from "next/image";
import RiskGuardianDashboard from "./RiskGuardianDashboard";

export default function RiskPage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 px-4 py-6 sm:px-6 lg:px-8">
      <Image src="/capa.png" alt="Stellaro background" fill priority sizes="100vw" className="object-cover object-center opacity-25" />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/92 to-slate-900/78" />
      <div className="relative z-10 mx-auto w-full max-w-7xl space-y-8 p-6">
        <RiskGuardianDashboard />
      </div>
    </div>
  );
}
