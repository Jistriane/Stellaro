import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { SecurityService } from './security.service';
import { ElizaGuard } from '../auth/eliza.guard';

/*
Expected payload example:
{
  "userId": "uuid",
  "severity": "high" | "medium" | "low",
  "actions": ["block_user", "revoke_sessions", "rotate_tokens"],
  "reason": "anomaly_detected",
  "meta": { "signal": "kyc_flag", "score": 0.92 }
}
*/

@Controller('security/risk')
@UseGuards(ElizaGuard)
export class RiskController {
  constructor(private readonly security: SecurityService) {}

  @Post('alert')
  async alert(
    @Body()
    body: {
      userId: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      actions?: string[];
      reason?: string;
      meta?: Record<string, unknown>;
    },
  ) {
    const actions = body.actions ?? [];

    if (actions.includes('block_user')) {
      await this.security.blockUser(body.userId, body.reason ?? 'risk_alert');
    }
    if (actions.includes('revoke_sessions')) {
      await this.security.revokeSessions(body.userId);
    }
    if (actions.includes('rotate_tokens')) {
      await this.security.rotateTokens(body.userId);
    }

    return { ok: true };
  }
}
