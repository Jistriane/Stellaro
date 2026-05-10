import { Injectable, Logger } from '@nestjs/common';
import * as StellarSdk from '@stellar/stellar-sdk';
import { SorobanService } from '../chain/soroban.service';
import { NotificationService } from './notification.service';
import { BridgeService } from './bridge.service';
import { Subject } from 'rxjs';

export interface PortfolioAllocation {
  asset: string;
  percentage: number;
}

import { ConfigService } from '@nestjs/config';

@Injectable()
export class RoboAdvisorService {
  private readonly logger = new Logger(RoboAdvisorService.name);
  public threatLog$ = new Subject<any>();
  public isAgentActive = true;

  constructor(
    private sorobanService: SorobanService,
    private notificationService: NotificationService,
    private bridgeService: BridgeService,
    private configService: ConfigService
  ) {}

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

  async executeStrategy(userId: string, actions: any[]) {
    this.logger.log(`Executing AI Strategy for user ${userId}: ${JSON.stringify(actions)}`);
    
    // Safety Limits (Circuit Breakers)
    const MAX_DAILY_VOLUME = 50000; // 50k tokens max per day
    const currentDailyVolume = await this.getUserDailyVolume(userId);
    
    for (const action of actions) {
      if (currentDailyVolume + action.amount > MAX_DAILY_VOLUME) {
        this.logger.warn(`Safety Limit Triggered for user ${userId}. Skipping trade for ${action.asset}.`);
        continue;
      }

      try {
        const fromAsset = action.type === 'BUY' ? 'XLM' : action.asset;
        const toAsset = action.type === 'BUY' ? action.asset : 'XLM';
        const amountBigInt = BigInt(Math.floor(action.amount * 10**7));

        // Circuit Breaker: Pre-execution Slippage Check
        const bestPath = await this.sorobanService.findBestPath(fromAsset, toAsset, amountBigInt.toString());
        
        // Slippage Calculation: (Best Route vs Ideal Rate)
        // If the path has more than 2 hops, it's a red flag for volatility in this simplified model
        if (bestPath.path.length > 2) {
          this.logger.warn(`[CircuitBreaker] High slippage risk detected for ${userId} swapping ${fromAsset} -> ${toAsset}. Aborting.`);
          continue;
        }

        this.logger.log(`[RoboAdvisor] Executing swap with path: ${bestPath.path.join(' -> ')}`);
        
        await this.sorobanService.executeSwap(userId, fromAsset, toAsset, amountBigInt);
        this.logger.log(`AI Swapped ${fromAsset} for ${toAsset} (Amount: ${action.amount})`);
        
        await this.recordTrade(userId, action.amount);
      } catch (error) {
        this.logger.error(`Failed to execute AI trade for ${userId}: ${error.message}`);
      }
    }

    return { status: 'completed', processed: actions.length };
  }

  private async getUserDailyVolume(userId: string): Promise<number> {
    // In production, this queries the DB for trades in the last 24h
    return 0; // Mocked for now
  }

  private async recordTrade(userId: string, amount: number) {
    this.logger.log(`Trade recorded for ${userId}: ${amount}`);
  }

  /**
   * Monitora a saúde dos empréstimos baseados em RWA usando Reflector Network
   */
  async monitorRwaHealth() {
    if (!this.isAgentActive) return;
    this.logger.log('[RiskGuardian] Polling RWA prices from Reflector Network...');
    
    try {
      const oracleId = process.env.REFLECTOR_ORACLE_ID;
      if (!oracleId) return;

      // 1. Get current RWA prices (e.g., GOLD, REAL-ESTATE-INDEX)
      // Simulação: chamando o contrato de oráculo
      const rwaPrice = await this.sorobanService.executeContractCall(
        oracleId,
        'get_price',
        [StellarSdk.xdr.ScVal.scvSymbol('RWA-GOLD')],
        null
      );

      this.logger.log(`[RiskGuardian] Current RWA-GOLD price: ${rwaPrice}`);

      // 2. Scan for risky positions in LoansPool
      // Em produção: iteraríamos sobre as contas ativas do LoansPool
      const riskyUsers = ['G...USER1', 'G...USER2']; 

      for (const user of riskyUsers) {
        const hf = await this.calculateHealthFactor(user, Number(rwaPrice));
        
        if (hf < 1.0) {
          this.logger.warn(`[RiskGuardian] Liquidation Triggered for ${user} due to RWA price drop!`);
          this.threatLog$.next({
            id: Date.now().toString(),
            timestamp: new Date(),
            type: 'Liquidação RWA',
            severity: 'high',
            message: `Risco extremo no colateral de ${user}. Liquidação automática via contrato Soroban.`
          });
          await this.executeLiquidation(user);
        } else if (hf < 1.1) {
          this.logger.log(`[RiskGuardian] User ${user} in DANGER ZONE (HF: ${hf}). Sending alert...`);
          this.threatLog$.next({
            id: Date.now().toString(),
            timestamp: new Date(),
            type: 'Variação Colateral',
            severity: 'medium',
            message: `Usuário ${user} entrou na Danger Zone (HF: ${hf}). Monitoramento intensificado.`
          });
          await this.notificationService.sendDangerZoneAlert(user, hf);
        }
      }
    } catch (e) {
      this.logger.error(`[RiskGuardian] Monitor Error: ${e.message}`);
    }
  }

  private async calculateHealthFactor(userId: string, currentPrice: number): Promise<number> {
    // Simulação: se o preço do ouro cai, o HF diminui
    // Ex: Preço 1900 -> HF 1.05 (Zona de Perigo)
    // Ex: Preço 1800 -> HF 0.99 (Liquidação)
    if (currentPrice < 1850) return 0.98;
    if (currentPrice < 1950) return 1.05;
    return 1.5;
  }

  private async executeLiquidation(userId: string) {
    const loansPoolId = process.env.LOANS_POOL_CONTRACT_ID;
    const adminSecret = process.env.MASTER_SECRET_KEY;

    await this.sorobanService.executeContractCall(
      loansPoolId,
      'liquidate',
      [StellarSdk.Address.fromString(userId).toScVal()],
      adminSecret
    );
    this.logger.log(`[RiskGuardian] Liquidation executed on-chain for ${userId}`);
  }

  /**
   * IA Busca liquidez global para grandes ordens
   */
  async executeInstitutionalStrategy(userId: string, actions: any[]) {
    for (const action of actions) {
      if (action.amount > 100000) { // Threshold Institucional $100k
        this.logger.log(`[LiquidityHub] Large order detected ($${action.amount}). Routing to External MM...`);
        // Simulação de execução OTC/Institutional Swap
        await new Promise(resolve => setTimeout(resolve, 800));
        this.logger.log(`[LiquidityHub] Order executed via Global Hub with 0.01% slippage.`);
      } else {
        this.logger.log(`[LiquidityHub] Executing batch action for ${userId}: ${JSON.stringify(action)}`);
      }
    }
  }

  /**
   * IA Monitora oportunidades de yield fora da rede Stellar
   */
  async checkCrossChainOpportunities() {
    this.logger.log('[RoboAdvisor] Scanning Cross-Chain Yield opportunities...');
    
    // Simulação: Yield no Arbitrum (ex: Aave/GMX) vs Stellar (Blend)
    const stellarYield = 0.08; // 8%
    const arbitrumYield = 0.15; // 15%
    
    if (arbitrumYield > stellarYield + 0.05) { // 5% spread threshold
      this.logger.log(`[RoboAdvisor] High Yield detected on Arbitrum (${arbitrumYield * 100}%). Rebalancing via Bridge...`);
      // Em produção: iterar usuários que ativaram 'Global Yield Mode'
      const users = ['G...USER1'];
      for (const user of users) {
        this.logger.log(`[RoboAdvisor] Executing cross chain yield move for ${user}`);
      }
    }
  }

  /**
   * Reinveste automaticamente dividendos de RWA
   */
  async autoCompoundRewards(userId: string) {
    this.logger.log(`[AutoCompound] Scanning for pending rewards for user ${userId}...`);
    
    // Simulação: Detecção de dividendos em STLT-USD
    const pendingRewards = 150.50; // $150.50
    
    if (pendingRewards > 10) { // Threshold de reinvestimento
      this.logger.log(`[AutoCompound] Compounding $${pendingRewards} for user ${userId}`);
      
      // Busca alocação alvo do usuário
      const profile = 'conservative'; 
      const actions = await this.calculateRebalance({ 'STLT-USD': pendingRewards }, profile);
      
      await this.executeStrategy(userId, actions);
      
      this.logger.log(`[AutoCompound] Successfully reinvested rewards for ${userId}.`);
    }
  }

  /**
   * Reports a risk event from a mobile device to the RiskGuardian dashboard.
   */
  reportMobileEvent(event: { type: string; userId: string; status: string; metadata?: any }) {
    const severityMap: Record<string, 'low' | 'medium' | 'high'> = {
      'BIO_FAILURE': 'high',
      'KYC_BLOCKED': 'medium',
      'TRADE_START': 'low',
      'BIO_SUCCESS': 'low'
    };

    const messageMap: Record<string, string> = {
      'BIO_FAILURE': `Falha crítica de biometria detectada no dispositivo de ${event.userId}.`,
      'KYC_BLOCKED': `Usuário ${event.userId} tentou acessar ativos RWA sem credencial SSI válida.`,
      'TRADE_START': `Início de operação RWA detectado no Mobile por ${event.userId}.`,
      'BIO_SUCCESS': `Autenticação biométrica bem-sucedida para ${event.userId}.`
    };

    this.logger.log(`[MobileTelemetry] Event: ${event.type} from ${event.userId}`);

    this.threatLog$.next({
      id: `mob-${Date.now()}`,
      timestamp: new Date(),
      type: `Mobile: ${event.type}`,
      severity: severityMap[event.type] || 'low',
      message: messageMap[event.type] || `Evento mobile não mapeado: ${event.type}`,
      origin: 'mobile'
    });
  }
}
