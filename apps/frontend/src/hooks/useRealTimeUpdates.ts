"use client";
import { useEffect } from "react";
import { useWalletStore } from "../state/wallet";
import { useAppStore } from "../store/app";
import { getWalletBalances } from "../lib/soroban";

/**
 * Hook para gerenciar atualizações em tempo real
 * Atualiza dados automaticamente quando a carteira é conectada/desconectada
 */
export function useRealTimeUpdates() {
  const walletConnected = useWalletStore((s) => s.connected);
  const walletAddress = useWalletStore((s) => s.address);
  const refreshBalance = useWalletStore((s) => s.refreshBalance);
  const setBalances = useAppStore((s) => s.setBalances);

  // Efeito para atualizações quando carteira conecta/desconecta
  useEffect(() => {
    let balanceInterval: NodeJS.Timeout | null = null;
    let sorobanInterval: NodeJS.Timeout | null = null;

    if (walletConnected && walletAddress) {
      console.log('[realtime] Wallet connected, starting real-time updates for:', walletAddress);

      // Atualiza saldo XLM do Horizon a cada 10 segundos
      const updateHorizonBalance = () => {
        refreshBalance().catch(error => {
          console.warn('[realtime] Failed to update Horizon balance:', error);
        });
      };

      // Atualiza saldos Soroban (STLT) a cada 15 segundos
      const updateSorobanBalances = async () => {
        try {
          const balances = await getWalletBalances(walletAddress);
          setBalances({ xlm: balances.xlm, stlt: balances.stlt });
          console.log('[realtime] Updated Soroban balances:', balances);
        } catch (error) {
          console.warn('[realtime] Failed to update Soroban balances:', error);
        }
      };

      // Atualização inicial imediata
      updateHorizonBalance();
      updateSorobanBalances();

      // Configurar intervalos
      balanceInterval = setInterval(updateHorizonBalance, 10000); // 10s
      sorobanInterval = setInterval(updateSorobanBalances, 15000); // 15s

      console.log('[realtime] Real-time updates started');
    } else {
      console.log('[realtime] Wallet disconnected, stopping real-time updates');
      
      // Limpar saldos quando desconecta
      setBalances({ xlm: 0, stlt: 0 });
    }

    // Cleanup
    return () => {
      if (balanceInterval) {
        clearInterval(balanceInterval);
        console.log('[realtime] Horizon balance interval cleared');
      }
      if (sorobanInterval) {
        clearInterval(sorobanInterval);
        console.log('[realtime] Soroban balance interval cleared');
      }
    };
  }, [walletConnected, walletAddress, refreshBalance, setBalances]);

  // Efeito para reagir a mudanças de visibilidade da página
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && walletConnected && walletAddress) {
        console.log('[realtime] Page became visible, refreshing data...');
        refreshBalance();
        
        // Atualizar saldos Soroban também
        getWalletBalances(walletAddress)
          .then(balances => {
            setBalances({ xlm: balances.xlm, stlt: balances.stlt });
            console.log('[realtime] Refreshed data on page focus:', balances);
          })
          .catch(error => {
            console.warn('[realtime] Failed to refresh data on page focus:', error);
          });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [walletConnected, walletAddress, refreshBalance, setBalances]);

  return {
    isUpdating: walletConnected,
    address: walletAddress
  };
}
