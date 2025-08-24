import { Injectable } from '@nestjs/common';

@Injectable()
export class OraclesService {
  async getPrice(base: string, quote: string) {
    // Chainlink-like stub: retornos determinísticos para facilitar testes
    const key = `${(base || '').toUpperCase()}/${(quote || '').toUpperCase()}`;
    const table: Record<string, number> = {
      'USD/BRL': 5.2,
      'BRL/USD': 0.19230769,
      'XLM/USD': 0.12,
      'USD/XLM': 8.33333333,
    };
    const value = table[key] ?? 1.0;
    const decimals = 8;
    return { base, quote, value, decimals, feed: 'stub' };
  }

  async getSocialSentiment(asset: string) {
    // TODO: integrar fonte de sentimento
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
}
