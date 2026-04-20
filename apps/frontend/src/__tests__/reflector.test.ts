/**
 * Tests - Reflector Integration Frontend
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useReflectorPrice, useReflectorPrices, usePortfolioValuation } from '@/hooks/useReflectorPrices';
import { reflectorClient } from '@/services/reflectorClient';

// Mock do cliente Reflector
vi.mock('@/services/reflectorClient', () => ({
  reflectorClient: {
    getPrice: vi.fn(),
    getPrices: vi.fn(),
    getPortfolioValuation: vi.fn(),
    detectAnomaly: vi.fn(),
    validatePrice: vi.fn(),
    subscribe: vi.fn(() => () => {}),
  },
}));

describe('ReflectorClient', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('getPrice', () => {
    it('should return price with timestamp', async () => {
      const mockPrice = {
        symbol: 'USDC',
        price: 1.0,
        timestamp: Date.now(),
        source: 'reflector',
        confidence: 0.99,
      };

      vi.mocked(reflectorClient.getPrice).mockResolvedValue(mockPrice);

      const result = await reflectorClient.getPrice('USDC');

      expect(result).toEqual(mockPrice);
      expect(result.symbol).toBe('USDC');
      expect(result.price).toBe(1.0);
    });

    it('should return stable values for repeated requests', async () => {
      const mockPrice = {
        symbol: 'BTC',
        price: 45000,
        timestamp: Date.now(),
        source: 'reflector',
      };

      vi.mocked(reflectorClient.getPrice).mockResolvedValue(mockPrice);

      const result1 = await reflectorClient.getPrice('BTC');
      const result2 = await reflectorClient.getPrice('BTC');

      expect(result1).toEqual(mockPrice);
      expect(result2).toEqual(mockPrice);
      expect(reflectorClient.getPrice).toHaveBeenCalledTimes(2);
    });

    it('should fallback on error', async () => {
      vi.mocked(reflectorClient.getPrice).mockRejectedValueOnce(new Error('API Error'));

      await expect(reflectorClient.getPrice('INVALID')).rejects.toThrow();
    });
  });

  describe('getPrices', () => {
    it('should return multiple prices in parallel', async () => {
      const mockPrices = new Map([
        [
          'USDC',
          {
            symbol: 'USDC',
            price: 1.0,
            timestamp: Date.now(),
            source: 'reflector',
          },
        ],
        [
          'XLM',
          {
            symbol: 'XLM',
            price: 0.15,
            timestamp: Date.now(),
            source: 'reflector',
          },
        ],
      ]);

      vi.mocked(reflectorClient.getPrices).mockResolvedValueOnce(mockPrices);

      const result = await reflectorClient.getPrices(['USDC', 'XLM']);

      expect(result.size).toBe(2);
      expect(result.get('USDC')).toBeDefined();
      expect(result.get('XLM')).toBeDefined();
    });
  });

  describe('getPortfolioValuation', () => {
    it('should calculate total appreciation', async () => {
      const portfolio = new Map([
        ['USDC', 1000],
        ['XLM', 500],
      ]);

      const mockValuation = {
        totalUSD: 1075,
        assets: new Map([
          [
            'USDC',
            { quantity: 1000, value: 1000, price: 1.0 },
          ],
          [
            'XLM',
            { quantity: 500, value: 75, price: 0.15 },
          ],
        ]),
        lastUpdate: Date.now(),
      };

      vi.mocked(reflectorClient.getPortfolioValuation).mockResolvedValueOnce(mockValuation);

      const result = await reflectorClient.getPortfolioValuation(portfolio);

      expect(result.totalUSD).toBe(1075);
      expect(result.assets.size).toBe(2);
    });
  });
});

describe('useReflectorPrice Hook', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should load price and show loading state', async () => {
    const mockPrice = {
      symbol: 'USDC',
      price: 1.0,
      timestamp: Date.now(),
      source: 'reflector',
    };

    vi.mocked(reflectorClient.getPrice).mockResolvedValueOnce(mockPrice);

    const { result } = renderHook(() => useReflectorPrice('USDC'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.price).toEqual(mockPrice);
    expect(result.current.error).toBeNull();
  });

  it('should show error on failure', async () => {
    const error = new Error('Failed to fetch price');
    vi.mocked(reflectorClient.getPrice).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useReflectorPrice('INVALID'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.price).toBeNull();
  });
});

describe('useReflectorPrices Hook', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should load multiple prices', async () => {
    const mockPrices = new Map([
      [
        'USDC',
        {
          symbol: 'USDC',
          price: 1.0,
          timestamp: Date.now(),
          source: 'reflector',
        },
      ],
      [
        'XLM',
        {
          symbol: 'XLM',
          price: 0.15,
          timestamp: Date.now(),
          source: 'reflector',
        },
      ],
    ]);

    vi.mocked(reflectorClient.getPrices).mockResolvedValue(mockPrices);

    const { result } = renderHook(() => useReflectorPrices(['USDC', 'XLM']));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.prices.size).toBe(2);
    expect(result.current.error).toBeNull();
  });
});

describe('usePortfolioValuation Hook', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should calculate appreciation and refresh periodically', async () => {
    const portfolio = new Map([
      ['USDC', 1000],
      ['XLM', 500],
    ]);

    const mockValuation = {
      totalUSD: 1075,
      assets: new Map([
        [
          'USDC',
          { quantity: 1000, value: 1000, price: 1.0 },
        ],
        [
          'XLM',
          { quantity: 500, value: 75, price: 0.15 },
        ],
      ]),
      lastUpdate: Date.now(),
    };

    vi.mocked(reflectorClient.getPortfolioValuation).mockResolvedValue(mockValuation);

    const { result } = renderHook(() => usePortfolioValuation(portfolio));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.valuation).toEqual(mockValuation);
    expect(result.current.valuation?.totalUSD).toBe(1075);
  });
});
