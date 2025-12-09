"use client";
import { useEffect } from "react";
import { useWalletStore } from "../state/wallet";

/**
 * Component that enforces robust wallet detection
 * Use it on pages where wallet detection is critical.
 */
export default function WalletDetectionEnforcer() {
  const refreshAvailable = useWalletStore((s) => s.refreshAvailable);

  useEffect(() => {
    if (typeof window === "undefined") return;

    console.log("[WalletDetectionEnforcer] Starting aggressive wallet detection...");
    
    // Force immediate detection
    refreshAvailable();

    // Force detection after a delay (for slow extensions)
    const timeouts = [
      setTimeout(() => {
        console.log("[WalletDetectionEnforcer] Re-checking wallets after 1s...");
        refreshAvailable();
      }, 1000),
      
      setTimeout(() => {
        console.log("[WalletDetectionEnforcer] Re-checking wallets after 3s...");
        refreshAvailable();
      }, 3000),
      
      setTimeout(() => {
        console.log("[WalletDetectionEnforcer] Re-checking wallets after 5s...");
        refreshAvailable();
      }, 5000),
      
      setTimeout(() => {
        console.log("[WalletDetectionEnforcer] Final wallet check after 10s...");
        refreshAvailable();
      }, 10000),
    ];

    // Listen for DOM events that indicate extensions may have loaded
    const handleDOMChange = () => {
      console.log("[WalletDetectionEnforcer] DOM change detected, re-checking wallets...");
      refreshAvailable();
    };

    // Detect when the document is fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', handleDOMChange);
    }
    
    document.addEventListener('readystatechange', handleDOMChange);
    window.addEventListener('load', handleDOMChange);

    // Cleanup
    return () => {
      timeouts.forEach(clearTimeout);
      document.removeEventListener('DOMContentLoaded', handleDOMChange);
      document.removeEventListener('readystatechange', handleDOMChange);
      window.removeEventListener('load', handleDOMChange);
    };
  }, [refreshAvailable]);

  // This component renders nothing
  return null;
}
