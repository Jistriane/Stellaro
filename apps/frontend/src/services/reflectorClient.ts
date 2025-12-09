/**
 * Reflector Network Client
 * 
 * Service for integration with Reflector Network via backend API
 * Provides real-time prices with intelligent caching
 */

export interface ReflectorPrice {
  symbol: string;
  price: number;
  timestamp: number;
  source: string;
  confidence?: number;
}

export interface PriceAnomalyReport {
  isAnomaly: boolean;
  severity: 'NORMAL' | 'HIGH' | 'CRITICAL';
  zScore: number;
  recommendation: string;
  priceChange: number;
}

export interface PortfolioValuation {
  totalUSD: number;
  assets: Map<string, { quantity: number; value: number; price: number }>;
  lastUpdate: number;
}

class ReflectorClient {
  private baseUrl: string;
  private priceCache: Map<string, { data: ReflectorPrice; expiresAt: number }>;
  private cacheTTL: number;
  private listeners: Set<(prices: Map<string, ReflectorPrice>) => void>;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') {
    this.baseUrl = baseUrl;
    this.priceCache = new Map();
    this.cacheTTL = 60000; // 1 minuto
    this.listeners = new Set();
    this.startAutoRefresh();
  }

  /**
   * Gets individual price with caching
   */
  async getPrice(assetCode: string, issuer?: string): Promise<ReflectorPrice> {
    const cacheKey = `${assetCode}:${issuer || 'native'}`;
    const cached = this.priceCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/reflector/prices/${assetCode}${issuer ? `?issuer=${issuer}` : ''}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(5000),
        }
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      const priceData: ReflectorPrice = {
        symbol: assetCode,
        price: data.price,
        timestamp: data.timestamp,
        source: data.source || 'reflector',
        confidence: data.confidence,
      };

      this.priceCache.set(cacheKey, {
        data: priceData,
        expiresAt: Date.now() + this.cacheTTL,
      });

      return priceData;
    } catch (error) {
      console.error(`[ReflectorClient] Failed to fetch price for ${assetCode}:`, error);
      
      // Fallback para cache expirado
      if (cached) {
        console.warn(`[ReflectorClient] Using stale cache for ${cacheKey}`);
        return cached.data;
      }

      throw error;
    }
  }

  /**
   * Fetch multiple prices in parallel
   */
  async getPrices(assets: string[]): Promise<Map<string, ReflectorPrice>> {
    const pricePromises = assets.map((asset) => this.getPrice(asset).catch(() => null));
    const prices = await Promise.all(pricePromises);

    const priceMap = new Map<string, ReflectorPrice>();
    prices.forEach((price, idx) => {
      if (price) {
        priceMap.set(assets[idx], price);
      }
    });

    // Notifica listeners
    this.notifyListeners(priceMap);

    return priceMap;
  }

  /**
   * Validate if price is within the expected margin
   */
  async validatePrice(
    assetCode: string,
    expectedPrice: number,
    toleranceBps: number = 500 // 5%
  ): Promise<boolean> {
    const currentPrice = await this.getPrice(assetCode);
    const deviation = Math.abs(currentPrice.price - expectedPrice) / expectedPrice;
    const tolerance = toleranceBps / 10000;

    return deviation <= tolerance;
  }

  /**
   * Detect price anomalies via backend
   */
  async detectAnomaly(
    assetCode: string,
    windowMinutes: number = 15
  ): Promise<PriceAnomalyReport> {
    try {
      const response = await fetch(
        `${this.baseUrl}/reflector/anomalies/${assetCode}?window=${windowMinutes}`,
        {
          method: 'GET',
          signal: AbortSignal.timeout(10000),
        }
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`[ReflectorClient] Failed to detect anomaly:`, error);
      return {
        isAnomaly: false,
        severity: 'NORMAL',
        zScore: 0,
        recommendation: 'MONITOR',
        priceChange: 0,
      };
    }
  }

  /**
   * Calculate portfolio valuation
   */
  async getPortfolioValuation(
    portfolio: Map<string, number>
  ): Promise<PortfolioValuation> {
    const assets = Array.from(portfolio.keys());
    const prices = await this.getPrices(assets);

    let totalUSD = 0;
    const valuedAssets = new Map<string, { quantity: number; value: number; price: number }>();

    portfolio.forEach((quantity, asset) => {
      const priceData = prices.get(asset);
      if (priceData) {
        const value = quantity * priceData.price;
        totalUSD += value;
        valuedAssets.set(asset, {
          quantity,
          value,
          price: priceData.price,
        });
      }
    });

    return {
      totalUSD,
      assets: valuedAssets,
      lastUpdate: Date.now(),
    };
  }

  /**
   * Subscribe to price updates
   */
  subscribe(callback: (prices: Map<string, ReflectorPrice>) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(prices: Map<string, ReflectorPrice>) {
    this.listeners.forEach((callback) => {
      try {
        callback(prices);
      } catch (error) {
        console.error('[ReflectorClient] Listener error:', error);
      }
    });
  }

  /**
   * Auto-refresh prices every 30 seconds
   */
  private startAutoRefresh() {
    setInterval(() => {
      // Refresh only assets that have listeners
      if (this.listeners.size > 0 && this.priceCache.size > 0) {
        const assets = Array.from(this.priceCache.keys()).map((key) => key.split(':')[0]);
        this.getPrices(assets).catch((error) =>
          console.error('[ReflectorClient] Auto-refresh failed:', error)
        );
      }
    }, 30000);
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.priceCache.clear();
  }
}

// Singleton instance
export const reflectorClient = new ReflectorClient();
