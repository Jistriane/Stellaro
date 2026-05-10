import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RiskGuardianService } from './risk-guardian.service';

@Injectable()
export class StressTestService {
  private readonly logger = new Logger(StressTestService.name);

  constructor(
    private prisma: PrismaService,
    private guardian: RiskGuardianService,
  ) {}

  /**
   * Simula um ataque de Flash-Loan/Reentrancy gerando logs de erro em massa.
   */
  async simulateExploitAttack() {
    this.logger.warn('⚠️ STARTING EXPLOIT SIMULATION...');

    // Simulamos a geração de 60 logs de erro em 5 segundos
    for (let i = 0; i < 60; i++) {
      await this.prisma.auditLog.create({
        data: {
          channel: 'BOTH',
          level: 'ERROR',
          action: 'FAILED_TRANSACTION_SIMULATED_ATTACK',
          metadata: { reason: 'Potential Reentrancy' } as any,
          userId: 'attacker_0x123'
        }
      });
      
      // Delay pequeno entre logs
      await new Promise(r => setTimeout(r, 50));
    }

    this.logger.log('Simulation logs generated. Waiting for RiskGuardian to detect...');
    
    // O RiskGuardian roda a cada 15s. Vamos forçar uma checagem.
    await this.guardian.checkProtocolHealth();
    
    return { status: 'Simulation Completed', logsGenerated: 60 };
  }

  /**
   * Simula volatilidade extrema para testar Circuit Breakers do Robo-Advisor.
   */
  async simulateExtremeVolatility() {
    this.logger.warn('⚠️ SIMULATING EXTREME VOLATILITY...');
    // Implementação de manipulação de preço em Oracle Mock se necessário
  }
}
