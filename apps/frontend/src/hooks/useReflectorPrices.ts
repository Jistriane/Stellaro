/**
 * useReflectorPrices Hook
 * 
 * React hook for integration with Reflector Network
 * Provides real-time prices with automatic updates
 */

import { useEffect, useState, useCallback } from 'react';
import { reflectorClient, ReflectorPrice, PortfolioValuation, PriceAnomalyReport } from '@/services/reflectorClient';

/**
 * Hook to get single price with auto-refresh
 */
export function useReflectorPrice(assetCode: string) {
  const [price, setPrice] = useState<ReflectorPrice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    reflectorClient
      .getPrice(assetCode)
      .then((data) => {
        setPrice(data);
        setError(null);
      })
      .catch((err) => {
        setError(err);
        setPrice(null);
      })
      .finally(() => setLoading(false));

    // Subscribe for updates
    const unsubscribe = reflectorClient.subscribe((prices) => {
      const updated = prices.get(assetCode);
      if (updated) {
        setPrice(updated);
      }
    });

    return unsubscribe;
  }, [assetCode]);

  return { price, loading, error };
}

/**
 * Hook to get multiple prices
 */
export function useReflectorPrices(assets: string[]) {
  const [prices, setPrices] = useState<Map<string, ReflectorPrice>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!assets || assets.length === 0) {
      setPrices(new Map());
      setLoading(false);
      return;
    }

    const fetchPrices = async () => {
      try {
        setLoading(true);
        const data = await reflectorClient.getPrices(assets);
        setPrices(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setPrices(new Map());
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();

    // Subscribe for updates
    const unsubscribe = reflectorClient.subscribe((updatedPrices) => {
      setPrices((prev) => {
        const newMap = new Map(prev);
        updatedPrices.forEach((price, asset) => {
          if (assets.includes(asset)) {
            newMap.set(asset, price);
          }
        });
        return newMap;
      });
    });

    return unsubscribe;
  }, [assets]);

  return { prices, loading, error };
}

/**
 * Hook to get portfolio valuation
 */
export function usePortfolioValuation(portfolio: Map<string, number>) {
  const [valuation, setValuation] = useState<PortfolioValuation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const updateValuation = useCallback(async () => {
    if (portfolio.size === 0) {
      setValuation(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await reflectorClient.getPortfolioValuation(portfolio);
      setValuation(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setValuation(null);
    } finally {
      setLoading(false);
    }
  }, [portfolio]);

  useEffect(() => {
    updateValuation();

    // Auto-refresh every 1 minute
    const interval = setInterval(updateValuation, 60000);
    return () => clearInterval(interval);
  }, [updateValuation]);

  return { valuation, loading, error, refresh: updateValuation };
}

/**
 * Hook for price anomaly detection
 */
export function usePriceAnomaly(assetCode: string, windowMinutes: number = 15) {
  const [anomaly, setAnomaly] = useState<PriceAnomalyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const checkAnomaly = useCallback(async () => {
    try {
      setLoading(true);
      const data = await reflectorClient.detectAnomaly(assetCode, windowMinutes);
      setAnomaly(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setAnomaly(null);
    } finally {
      setLoading(false);
    }
  }, [assetCode, windowMinutes]);

  useEffect(() => {
    checkAnomaly();
  }, [checkAnomaly]);

  return { anomaly, loading, error, checkAnomaly };
}

/**
 * Hook to validate price within tolerance
 */
export function usePriceValidation(assetCode: string, expectedPrice: number, toleranceBps = 500) {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    reflectorClient
      .validatePrice(assetCode, expectedPrice, toleranceBps)
      .then((valid) => {
        setIsValid(valid);
        setError(null);
      })
      .catch((err) => {
        setError(err);
        setIsValid(null);
      })
      .finally(() => setLoading(false));
  }, [assetCode, expectedPrice, toleranceBps]);

  return { isValid, loading, error };
}
