"use client";
import { useEffect } from "react";
import { useWalletStore } from "../state/wallet";

/**
 * Componente que força a detecção robusta de carteiras
 * Deve ser usado em páginas onde a detecção de carteiras é crítica
 */
export default function WalletDetectionEnforcer() {
  const refreshAvailable = useWalletStore((s) => s.refreshAvailable);

  useEffect(() => {
    if (typeof window === "undefined") return;

    console.log("[WalletDetectionEnforcer] Starting aggressive wallet detection...");
    
    // Força detecção imediata
    refreshAvailable();

    // Força detecção após um tempo (para extensões lentas)
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

    // Escuta eventos específicos do DOM que indicam que extensões podem ter carregado
    const handleDOMChange = () => {
      console.log("[WalletDetectionEnforcer] DOM change detected, re-checking wallets...");
      refreshAvailable();
    };

    // Detecta quando o documento está totalmente carregado
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

  // Este componente não renderiza nada
  return null;
}
