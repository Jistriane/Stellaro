import { Injectable, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

export interface WebhookPayload {
  event: 'LIQUIDATION' | 'SWAP_COMPLETE' | 'PROPOSAL_CREATED' | 'VC_ISSUED' | 'SECURITY_ALERT';
  timestamp: number;
  data: any;
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(@Optional() private readonly prisma?: PrismaService) {}

  async registerEndpoint(url: string, events: string[] = ['*']) {
    if (this.prisma && (this.prisma as any).webhookSubscription) {
      await (this.prisma as any).webhookSubscription.upsert({
        where: { url },
        update: { events, active: true },
        create: { url, events, active: true },
      });
    }
    this.logger.log(`[WebhookHub] Endpoint registered/updated: ${url}`);
  }

  async notifyComplianceIssue(userAddress: string, issueType: string, details: any) {
    this.logger.error(`[ComplianceAlert] Issue detected for ${userAddress}: ${issueType}`);
    await this.trigger('SECURITY_ALERT', { userAddress, issueType, details });
  }

  /**
   * Triggers an event for all ecosystem partners
   */
  async trigger(event: WebhookPayload['event'], data: any) {
    const payload: WebhookPayload = {
      event,
      timestamp: Date.now(),
      data,
    };

    const endpoints = (this.prisma && (this.prisma as any).webhookSubscription)
      ? await (this.prisma as any).webhookSubscription.findMany({ where: { active: true } })
      : [];

    this.logger.log(`[WebhookHub] Triggering event ${event} for ${endpoints.length} endpoints.`);

    for (const sub of endpoints) {
      // Filtrar por evento se não for '*'
      if (sub.events.includes('*') || sub.events.includes(event)) {
        try {
          await axios.post(sub.url, payload, { timeout: 3000 });
          this.logger.log(`[WebhookHub] Event delivered to ${sub.url}`);
        } catch (e: any) {
          this.logger.error(`[WebhookHub] Failed to deliver event to ${sub.url}: ${e.message}`);
        }
      }
    }
  }
}
