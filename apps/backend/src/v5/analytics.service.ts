import { Injectable, Logger } from '@nestjs/common';
import { SorobanService } from '../chain/soroban.service';

export interface ProtocolMetrics {
  totalValueLocked: number;
  totalDebt: number;
  globalHealthFactor: number;
  activeAuctions: number;
  protocolRevenue: number;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly sorobanService: SorobanService) {}

  /**
   * Agrega métricas globais de saúde do protocolo para a DAO
   */
  async getGlobalMetrics(): Promise<ProtocolMetrics> {
    this.logger.log('[Analytics] Fetching global metrics...');

    try {
      // Em produção: leríamos o estado de múltiplos contratos via SorobanService
      // Aqui simulamos a agregação de dados
      return {
        totalValueLocked: 15450000, // $15.45M
        totalDebt: 8200000,       // $8.2M
        globalHealthFactor: 1.88,
        activeAuctions: 4,
        protocolRevenue: 125000,   // Fees acumuladas
      };
    } catch (e) {
      this.logger.error(`[Analytics] Error fetching metrics: ${e.message}`);
      throw e;
    }
  }

  async getAuctionHistory() {
    // Retorna histórico de leilões concluídos e volume recuperado
    return [
      { id: 1, asset: 'RWA-GOLD-01', recovered: 45000, date: '2026-04-20' },
      { id: 2, asset: 'RWA-APT-42', recovered: 120000, date: '2026-04-22' },
    ];
  }
}
