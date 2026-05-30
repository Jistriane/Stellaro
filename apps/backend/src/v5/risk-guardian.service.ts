import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SorobanService } from '../chain/soroban.service';
import { NotificationService } from './notification.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RiskGuardianService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RiskGuardianService.name);
  private isEmergencyActive = false;
  private monitoringTimer?: NodeJS.Timeout;

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

  onModuleDestroy() {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = undefined;
    }
  }

  /**
   * Monitoramento contínuo de anomalias no protocolo.
   */
  private startProtocolMonitoring() {
    this.monitoringTimer = setInterval(async () => {
      try {
        await this.checkProtocolHealth();
      } catch (error) {
        this.logger.error(`Guardian monitoring failed: ${error.message}`);
      }
    }, 15000); // Check a cada 15 segundos (High Frequency)

    // Prevent this background timer from keeping test processes alive.
    this.monitoringTimer.unref();
  }

  /**
   * Avalia a saúde do protocolo baseada em TVL, Falhas e Atividade.
   */
  async checkProtocolHealth() {
    if (!this.prisma.auditLog?.count) {
      return;
    }

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
