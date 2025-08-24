"use client";

import { useRealTimeUpdates } from "../hooks/useRealTimeUpdates";

interface RealTimeWrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper component que adiciona funcionalidade de atualizações em tempo real
 * para Server Components que precisam de reatividade de carteira
 */
export default function RealTimeWrapper({ children }: RealTimeWrapperProps) {
  // Ativa atualizações em tempo real quando carteira conecta
  useRealTimeUpdates();
  
  return <>{children}</>;
}
