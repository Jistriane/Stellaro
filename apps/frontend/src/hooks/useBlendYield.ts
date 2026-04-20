'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to optimize yield using Blend Protocol
 * Real integration with @blend-capital/blend-sdk
 */

export interface BlendPool {
  poolId: string;
  asset: string;
  supplyAPY: number;
  borrowAPY: number;
  tvl: number;
  utilization: number;
  totalSupply: number;
  totalBorrow: number;
  riskScore: number;
}

export interface OptimizationResult {
  currentPool?: BlendPool;
  optimalPool: BlendPool;
  potentialGainAPY: number;
  shouldMigrate: boolean;
}

export function useBlendYield(asset: string, network: 'testnet' | 'mainnet' = 'testnet') {
  const [pools, setPools] = useState<BlendPool[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available pools from Blend Protocol
  const fetchPools = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // TODO: Real integration with Blend SDK when available
      // const blendClient = new BlendClient({ network });
      // const pools = await blendClient.getPools(asset);
      
      // For now, use backend endpoint that does the integration
      const response = await fetch(`/api/defi/blend/pools?asset=${asset}&network=${network}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch Blend pools');
      }

      const data = await response.json();
      setPools(data.pools || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('[useBlendYield] Error fetching pools:', err);
    } finally {
      setLoading(false);
    }
  }, [asset, network]);

  // Find optimal pool based on APY and risk
  const findOptimalPool = useCallback((currentPoolId?: string): OptimizationResult | null => {
    if (pools.length === 0) return null;

    // Calculate composite score (APY / risk)
    type ScoredBlendPool = BlendPool & { score: number };

    const rankedPools: ScoredBlendPool[] = pools
      .map((pool) => ({
        ...pool,
        score: pool.supplyAPY / Math.max(pool.riskScore, 1),
      }))
      .sort((a, b) => b.score - a.score);

    const optimalPool = rankedPools[0];
    const currentPool = currentPoolId 
      ? pools.find(p => p.poolId === currentPoolId)
      : undefined;

    const potentialGainAPY = currentPool 
      ? optimalPool.supplyAPY - currentPool.supplyAPY
      : optimalPool.supplyAPY;

    return {
      currentPool,
      optimalPool,
      potentialGainAPY,
      shouldMigrate: potentialGainAPY > 0.02 // 2% threshold
    };
  }, [pools]);

  // Auto-compound rewards
  const autoCompound = useCallback(async (userAddress: string, poolId: string) => {
    try {
      const response = await fetch('/api/defi/blend/auto-compound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAddress, poolId, asset })
      });

      if (!response.ok) {
        throw new Error('Auto-compound failed');
      }

      return await response.json();
    } catch (err) {
      console.error('[useBlendYield] Auto-compound error:', err);
      throw err;
    }
  }, [asset]);

  useEffect(() => {
    if (asset) {
      fetchPools();
    }
  }, [asset, fetchPools]);

  return {
    pools,
    loading,
    error,
    refetch: fetchPools,
    findOptimalPool,
    autoCompound
  };
}
