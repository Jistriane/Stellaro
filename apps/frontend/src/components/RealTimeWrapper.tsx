"use client";

import { useRealTimeUpdates } from "../hooks/useRealTimeUpdates";

interface RealTimeWrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that enables real-time updates
 * for Server Components that need wallet reactivity.
 */
export default function RealTimeWrapper({ children }: RealTimeWrapperProps) {
  // Enable real-time updates when the wallet connects
  useRealTimeUpdates();
  
  return <>{children}</>;
}
