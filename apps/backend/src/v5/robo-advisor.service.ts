import { Injectable, Logger } from '@nestjs/common';

export interface PortfolioAllocation {
  asset: string;
  percentage: number;
}

@Injectable()
export class RoboAdvisorService {
  private readonly logger = new Logger(RoboAdvisorService.name);

  // Target allocations for different risk profiles
  private readonly profiles: Record<string, PortfolioAllocation[]> = {
    conservative: [
      { asset: 'STLT-BRL', percentage: 70 },
      { asset: 'XLM', percentage: 20 },
      { asset: 'RWA-APT', percentage: 10 },
    ],
    aggressive: [
      { asset: 'XLM', percentage: 50 },
      { asset: 'STLT-USD', percentage: 20 },
      { asset: 'RWA-BTC-TRUST', percentage: 30 },
    ],
  };

  async calculateRebalance(currentBalances: Record<string, number>, profile: string) {
    const target = this.profiles[profile];
    if (!target) throw new Error('Invalid profile');

    const totalValue = Object.values(currentBalances).reduce((a, b) => a + b, 0);
    const actions: any[] = [];

    target.forEach((t) => {
      const targetValue = (totalValue * t.percentage) / 100;
      const current = currentBalances[t.asset] || 0;
      const diff = targetValue - current;

      if (Math.abs(diff) > totalValue * 0.05) { // 5% threshold
        actions.push({
          asset: t.asset,
          type: diff > 0 ? 'BUY' : 'SELL',
          amount: Math.abs(diff),
        });
      }
    });

    return actions;
  }

  async executeStrategy(actions: any[]) {
    this.logger.log(`Executing AI Strategy: ${JSON.stringify(actions)}`);
    // Calls Swap service or Lending service to adjust positions
  }
}
