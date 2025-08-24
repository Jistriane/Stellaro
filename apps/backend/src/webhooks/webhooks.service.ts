import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class WebhooksService {
  private readonly secret = process.env.WEBHOOK_HMAC_SECRET || '';

  // Prefer RAW bytes if available; fallback to JSON string
  verifySignature(body: unknown, signature?: string) {
    if (!this.secret) return true; // if no secret configured, accept (dev)
    if (!signature) throw new UnauthorizedException('Missing signature');

    const payload: string | Buffer = Buffer.isBuffer(body)
      ? body
      : typeof body === 'string'
        ? body
        : JSON.stringify(body);
    const expected = crypto
      .createHmac('sha256', this.secret)
      .update(payload)
      .digest('hex');

    if (expected !== signature) {
      throw new UnauthorizedException('Invalid signature');
    }
    return true;
  }
}
