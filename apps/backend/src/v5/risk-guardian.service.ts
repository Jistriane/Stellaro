import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SorobanService } from '../chain/soroban.service';
import { NotificationService } from './notification.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RiskGuardianService implements OnModuleInit {
  private readonly logger = new Logger(RiskGuardianService.name);
  private isEmergencyActive = false;

  constructor(
    private configService: ConfigService,
    private soroban: SorobanService,
    private notification: NotificationService,
    private prisma: PrismaService,
  ) {}

  async onModuleInit() {
    this.logger.log('RiskGuardian (Active Defense) initialized.');
    this.startProtocolMonitoring();
  }

  /**
   * Monitoramento contínuo de anomalias no protocolo.
   */
  private startProtocolMonitoring() {
    setInterval(async () => {
      try {
        await this.checkProtocolHealth();
      } catch (error) {
        this.logger.error(`Guardian monitoring failed: ${error.message}`);
      }
    }, 15000); // Check a cada 15 segundos (High Frequency)
  }

  /**
   * Avalia a saúde do protocolo baseada em TVL, Falhas e Atividade.
   */
  async checkProtocolHealth() {
    // 1. Verificar volume de falhas em transações recentes (Mock via logs)
    const recentFailures = await this.prisma.auditLog.count({
      where: {
        level: 'ERROR',
        createdAt: { gte: new Date(Date.now() - 600000) } // Últimos 10 min
      }
    });

    // 2. Threshold de Emergência: 50 falhas em 10 min
    if (recentFailures > 50 && !this.isEmergencyActive) {
      await this.triggerEmergencyPause('High Failure Rate Detected (Flash Exploit Potential)');
    }
  }

  /**
   * Dispara o protocolo de emergência (Pause All).
   */
  async triggerEmergencyPause(reason: string) {
    this.logger.error(`🚨 EMERGENCY PAUSE TRIGGERED: ${reason}`);
    this.isEmergencyActive = true;

    const contractsToPause = [
      this.configService.get('STABLECOIN_CONTRACT_ID'),
      this.configService.get('LOANS_POOL_CONTRACT_ID'),
      this.configService.get('RECURRING_PAYMENTS_ID')
    ];

    const adminSecret = this.configService.get('MASTER_SECRET_KEY');

    for (const contractId of contractsToPause) {
      if (!contractId) continue;
      try {
        await this.soroban.setContractPaused(contractId, true, adminSecret);
        this.logger.warn(`✅ Contract ${contractId} paused.`);
      } catch (error) {
        this.logger.error(`Failed to pause contract ${contractId}: ${error.message}`);
      }
    }

    await this.notification.sendUndercollateralizationAlert(0, 0, { 
      action: 'PROTOCOL_FREEZE',
      reason 
    });
  }

  /**
   * Reverte o estado de emergência (Admin required).
   */
  async resumeProtocol() {
    this.isEmergencyActive = false;
    this.logger.log('Protocol emergency state cleared.');
  }
}
