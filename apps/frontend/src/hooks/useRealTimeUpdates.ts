"use client";
import { useEffect } from "react";
import { useWalletStore } from "../state/wallet";
import { useAppStore } from "../store/app";
import { getWalletBalances } from "../lib/soroban";

/**
 * Hook to manage real-time updates
 * Automatically updates data when wallet is connected/disconnected
 */
export function useRealTimeUpdates(options?: {
  enabled?: boolean;
  suppressDisconnectedNotice?: boolean;
}) {
  const enabled = options?.enabled ?? true;
  const suppressDisconnectedNotice = options?.suppressDisconnectedNotice ?? false;
  const walletConnected = useWalletStore((s) => s.connected);
  const walletAddress = useWalletStore((s) => s.address);
  const refreshBalance = useWalletStore((s) => s.refreshBalance);
  const setBalances = useAppStore((s) => s.setBalances);

  // Effect for updates when wallet connects/disconnects
  useEffect(() => {
    let balanceInterval: NodeJS.Timeout | null = null;
    let sorobanInterval: NodeJS.Timeout | null = null;

    if (!enabled) {
      return;
    }

    if (walletConnected && walletAddress) {
      console.log('[realtime] Wallet connected, starting real-time updates for:', walletAddress);

      // Updates XLM balance from Horizon every 10 seconds
      const updateHorizonBalance = () => {
        refreshBalance().catch(error => {
          console.warn('[realtime] Failed to update Horizon balance:', error);
        });
      };

      // Updates Soroban balances (STLT) every 15 seconds
      const updateSorobanBalances = async () => {
        try {
          const balances = await getWalletBalances(walletAddress);
          setBalances({ xlm: balances.xlm, stlt: balances.stlt });
          console.log('[realtime] Updated Soroban balances:', balances);
        } catch (error) {
          console.warn('[realtime] Failed to update Soroban balances:', error);
        }
      };

      // Immediate initial update
      updateHorizonBalance();
      updateSorobanBalances();

      // Set up intervals
      balanceInterval = setInterval(updateHorizonBalance, 10000); // 10s
      sorobanInterval = setInterval(updateSorobanBalances, 15000); // 15s

      console.log('[realtime] Real-time updates started');
    } else {
      if (!suppressDisconnectedNotice) {
        console.log('[realtime] Wallet disconnected, stopping real-time updates');
      }
      
      // Clear balances when disconnected
      setBalances({ xlm: '0', stlt: '0' });
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
  }, [enabled, suppressDisconnectedNotice, walletConnected, walletAddress, refreshBalance, setBalances]);

  // Effect to react to page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!enabled) {
        return;
      }
      if (document.visibilityState === 'visible' && walletConnected && walletAddress) {
        console.log('[realtime] Page became visible, refreshing data...');
        refreshBalance();
        
        // Update Soroban balances too
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
  }, [enabled, walletConnected, walletAddress, refreshBalance, setBalances]);

  return {
    isUpdating: enabled && walletConnected,
    address: walletAddress
  };
}
