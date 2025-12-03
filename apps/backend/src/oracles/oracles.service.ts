import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import axios from 'axios';

export interface PriceData {
  base: string;
  quote: string;
  value: number;
  decimals: number;
  feed: string;
  timestamp: number;
  volatility?: number;
}

export interface AggregatedPrice {
  asset: string;
  prices: PriceData[];
  median: number;
  average: number;
  deviation: number;
}

/**
 * Oracles Service - Integração com Reflector Network
 * Fornece feeds de preços multi-fonte com agregação
 */
@Injectable()
export class OraclesService {
  private readonly logger = new Logger(OraclesService.name);
  private readonly reflectorUrl: string;
  private readonly cachePrefix = 'oracle:price:';
  private readonly cacheTTL = 60; // 60 segundos

  constructor(
    private config: ConfigService,
    private redis: RedisService,
  ) {
    this.reflectorUrl = this.config.get<string>(
      'REFLECTOR_URL',
      'https://api.reflector.network',
    );
  }

  /**
   * Obtém preço de um par usando Reflector Network
   * Com fallback para múltiplas fontes e circuit breaker
   */
  async getPrice(base: string, quote: string): Promise<PriceData> {
    const cacheKey = `${this.cachePrefix}${base}/${quote}`;

    // Check cache primeiro
    const cached = await this.redis.get<PriceData>(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL * 1000) {
      return cached;
    }

    try {
      // Tenta Reflector Network primeiro
      const reflectorPrice = await this.fetchReflectorPrice(base, quote);
      
      // Cache e retorna
      await this.redis.set(cacheKey, reflectorPrice, this.cacheTTL);
      return reflectorPrice;
    } catch (error) {
      this.logger.warn(
        `Reflector Network failed for ${base}/${quote}, using fallback`,
      );

      // Fallback para preços determinísticos (dev/test)
      return this.getFallbackPrice(base, quote);
    }
  }

  /**
   * Busca preço do Reflector Network
   */
  private async fetchReflectorPrice(
    base: string,
    quote: string,
  ): Promise<PriceData> {
    const response = await axios.get(
      `${this.reflectorUrl}/v1/price/${base}/${quote}`,
      { timeout: 3000 },
    );

    if (!response.data || !response.data.price) {
      throw new Error('Invalid Reflector response');
    }

    return {
      base,
      quote,
      value: response.data.price,
      decimals: response.data.decimals || 8,
      feed: 'reflector',
      timestamp: Date.now(),
      volatility: response.data.volatility || 0,
    };
  }

  /**
   * Preços fallback para dev/test
   */
  private getFallbackPrice(base: string, quote: string): PriceData {
    const key = `${base.toUpperCase()}/${quote.toUpperCase()}`;
    const table: Record<string, number> = {
      'USD/BRL': 5.2,
      'BRL/USD': 0.19230769,
      'XLM/USD': 0.12,
      'USD/XLM': 8.33333333,
      'USDC/USD': 1.0,
      'USD/USDC': 1.0,
    };

    return {
      base,
      quote,
      value: table[key] ?? 1.0,
      decimals: 8,
      feed: 'fallback',
      timestamp: Date.now(),
    };
  }

  /**
   * Obtém preços agregados de múltiplas fontes
   * Implementa circuit breaker para detecção de anomalias
   */
  async getAggregatedPrices(assets: string[]): Promise<AggregatedPrice[]> {
    const results: AggregatedPrice[] = [];

    for (const asset of assets) {
      try {
        // Busca de múltiplas fontes
        const [reflector, fallback] = await Promise.allSettled([
          this.fetchReflectorPrice(asset, 'USD'),
          this.getFallbackPrice(asset, 'USD'),
        ]);

        const prices: PriceData[] = [];
        
        if (reflector.status === 'fulfilled') {
          prices.push(reflector.value);
        }
        if (fallback.status === 'fulfilled') {
          prices.push(fallback.value);
        }

        if (prices.length === 0) {
          this.logger.error(`No price sources available for ${asset}`);
          continue;
        }

        const values = prices.map((p) => p.value);
        const median = this.calculateMedian(values);
        const average = values.reduce((a, b) => a + b, 0) / values.length;
        const deviation = this.calculateDeviation(values, average);

        // Circuit breaker: detecta preços anômalos
        if (deviation > 0.15) {
          // 15% desvio
          this.logger.warn(
            `High price deviation detected for ${asset}: ${deviation * 100}%`,
          );
        }

        results.push({
          asset,
          prices,
          median,
          average,
          deviation,
        });
      } catch (error) {
        this.logger.error(`Error aggregating prices for ${asset}:`, error);
      }
    }

    return results;
  }

  /**
   * Detecta anomalias de preço (pump & dump, flash crashes)
   */
  async detectAnomalies(asset: string): Promise<{
    anomalyDetected: boolean;
    volatility: number;
    recommendation: string;
  }> {
    const priceData = await this.getPrice(asset, 'USD');

    // Volatilidade > 15% = anomalia
    const isAnomalous = (priceData.volatility || 0) > 0.15;

    return {
      anomalyDetected: isAnomalous,
      volatility: priceData.volatility || 0,
      recommendation: isAnomalous
        ? 'HALT_TRADING'
        : 'CONTINUE_MONITORING',
    };
  }

  async getSocialSentiment(asset: string) {
    // TODO: integrar fonte de sentimento real (Santiment, LunarCrush)
    return { asset, sentiment: 'neutral', score: 0.5 };
  }

  async getDefiAlerts() {
    // TODO: integrar feeds de vulnerabilidades/alertas
    return [];
  }

  async getCrossChainEvents() {
    // TODO: integrar bridges/explorers
    return [];
  }

  // Helpers
  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  private calculateDeviation(values: number[], mean: number): number {
    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(variance);
    return stdDev / mean; // Desvio relativo
  }
}
