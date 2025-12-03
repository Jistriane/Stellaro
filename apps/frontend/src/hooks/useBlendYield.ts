'use client';

import { useState, useEffect } from 'react';
import { Asset, Networks } from '@stellar/stellar-sdk';

/**
 * Hook para otimizar yield usando Blend Protocol
 * Integração real com @blend-capital/blend-sdk
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

  // Busca pools disponíveis do Blend Protocol
  const fetchPools = async () => {
    setLoading(true);
    setError(null);

    try {
      // TODO: Integração real com Blend SDK quando disponível
      // const blendClient = new BlendClient({ network });
      // const pools = await blendClient.getPools(asset);
      
      // Por enquanto, usar endpoint do backend que faz a integração
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
  };

  // Encontra pool ótimo baseado em APY e risco
  const findOptimalPool = (currentPoolId?: string): OptimizationResult | null => {
    if (pools.length === 0) return null;

    // Calcula score composto (APY / risco)
    const rankedPools = pools
      .map(pool => ({
        ...pool,
        score: pool.supplyAPY / Math.max(pool.riskScore, 1)
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
  };

  // Auto-compound rewards
  const autoCompound = async (userAddress: string, poolId: string) => {
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
  };

  useEffect(() => {
    if (asset) {
      fetchPools();
    }
  }, [asset, network]);

  return {
    pools,
    loading,
    error,
    refetch: fetchPools,
    findOptimalPool,
    autoCompound
  };
}
