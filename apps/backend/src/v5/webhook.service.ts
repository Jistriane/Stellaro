import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface WebhookPayload {
  event: 'LIQUIDATION' | 'SWAP_COMPLETE' | 'PROPOSAL_CREATED' | 'VC_ISSUED';
  timestamp: number;
  data: any;
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  // Em produção: Buscar do banco de dados
  private registeredEndpoints: string[] = [];

  registerEndpoint(url: string) {
    this.registeredEndpoints.push(url);
    this.logger.log(`[WebhookHub] New endpoint registered: ${url}`);
  }

  async notifyComplianceIssue(userAddress: string, issueType: string, details: any) {
    this.logger.error(`[ComplianceAlert] Issue detected for ${userAddress}: ${issueType}`);
    await this.trigger('SECURITY_ALERT' as any, { userAddress, issueType, details });
  }

  /**
   * Triggers an event for all ecosystem partners
   */
  async trigger(event: WebhookPayload['event'] | 'SECURITY_ALERT', data: any) {
    const payload: WebhookPayload = {
      event: event as any,
      timestamp: Date.now(),
      data,
    };

    this.logger.log(`[WebhookHub] Triggering event ${event} for ${this.registeredEndpoints.length} endpoints.`);

    for (const endpoint of this.registeredEndpoints) {
      try {
        await axios.post(endpoint, payload, { timeout: 3000 });
        this.logger.log(`[WebhookHub] Event delivered to ${endpoint}`);
      } catch (e) {
        this.logger.error(`[WebhookHub] Failed to deliver event to ${endpoint}: ${e.message}`);
      }
    }
  }
}
