import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface NotificationPayload {
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'EMERGENCY';
  title: string;
  message: string;
  data?: Record<string, any>;
  timestamp: Date;
}

/**
 * Serviço de notificações multi-canal
 * Suporta: Webhook, Email (via SMTP), Console logging
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly webhookUrl: string;
  private readonly emailEnabled: boolean;
  
  constructor(private configService: ConfigService) {
    this.webhookUrl = this.configService.get('ALERT_WEBHOOK_URL') || '';
    this.emailEnabled = !!this.configService.get('SMTP_HOST');
  }

  /**
   * Envia notificação via múltiplos canais
   */
  async send(payload: NotificationPayload): Promise<void> {
    const promises: Promise<any>[] = [];

    // 1. Log no console (sempre)
    this.logNotification(payload);

    // 2. Webhook (se configurado)
    if (this.webhookUrl) {
      promises.push(this.sendWebhook(payload));
    }

    // 3. Email (se configurado)
    if (this.emailEnabled && payload.severity in ['CRITICAL', 'EMERGENCY']) {
      promises.push(this.sendEmail(payload));
    }

    await Promise.allSettled(promises);
  }

  /**
   * Log estruturado da notificação
   */
  private logNotification(payload: NotificationPayload): void {
    const logMethod =
      payload.severity === 'CRITICAL' || payload.severity === 'EMERGENCY'
        ? 'error'
        : payload.severity === 'WARNING'
          ? 'warn'
          : 'log';

    this.logger[logMethod](
      `[${payload.severity}] ${payload.title}: ${payload.message}`,
      payload.data,
    );
  }

  /**
   * Envia webhook para sistema externo (Slack, Discord, etc.)
   */
  private async sendWebhook(payload: NotificationPayload): Promise<void> {
    try {
      await axios.post(
        this.webhookUrl,
        {
          severity: payload.severity,
          title: payload.title,
          message: payload.message,
          data: payload.data,
          timestamp: payload.timestamp.toISOString(),
          source: 'Stellaro Reserve Manager',
        },
        { timeout: 5000 },
      );

      this.logger.debug(`Webhook sent successfully for ${payload.title}`);
    } catch (error) {
      this.logger.error(`Failed to send webhook: ${error.message}`);
    }
  }

  /**
   * Envia email via SMTP (implementação básica)
   */
  private async sendEmail(payload: NotificationPayload): Promise<void> {
    try {
      // TODO: Implementar integração SMTP real (nodemailer, sendgrid, etc.)
      // Por enquanto, apenas log
      this.logger.log(
        `[EMAIL STUB] Would send to admins: ${payload.title} - ${payload.message}`,
      );
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Envia alerta de undercollateralization
   */
  async sendUndercollateralizationAlert(
    ratio: number,
    threshold: number,
    snapshot: any,
  ): Promise<void> {
    await this.send({
      severity: 'EMERGENCY',
      title: '🚨 Undercollateralization Detected',
      message: `Collateralization ratio (${ratio.toFixed(2)}%) is below minimum threshold (${threshold}%). Minting has been frozen.`,
      data: {
        ratio,
        threshold,
        snapshot,
        action: 'MINTING_FROZEN',
      },
      timestamp: new Date(),
    });
  }

  /**
   * Envia alerta de warning
   */
  async sendWarningAlert(
    ratio: number,
    threshold: number,
    snapshot: any,
  ): Promise<void> {
    await this.send({
      severity: 'WARNING',
      title: '⚠️ Collateralization Warning',
      message: `Collateralization ratio (${ratio.toFixed(2)}%) is below warning threshold (${threshold}%). Please monitor closely.`,
      data: {
        ratio,
        threshold,
        snapshot,
        action: 'MONITOR',
      },
      timestamp: new Date(),
    });
  }
}
