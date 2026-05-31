import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import * as crypto from 'crypto';

describe('WebhooksService', () => {
  let mod: TestingModule;
  let service: WebhooksService;

  beforeAll(async () => {
    // Set secret for HMAC tests
    process.env.WEBHOOK_HMAC_SECRET = 'test-secret-key';

    mod = await Test.createTestingModule({
      providers: [WebhooksService],
    }).compile();

    service = mod.get<WebhooksService>(WebhooksService);
  });

  afterAll(async () => {
    delete process.env.WEBHOOK_HMAC_SECRET;
    await mod.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should verify valid HMAC signature for JSON body', () => {
    const body = { event: 'test', data: 'value' };
    const payload = JSON.stringify(body);
    const signature = crypto
      .createHmac('sha256', 'test-secret-key')
      .update(payload)
      .digest('hex');

    expect(() => service.verifySignature(body, signature)).not.toThrow();
  });

  it('should verify valid HMAC signature for Buffer body', () => {
    const body = Buffer.from('raw payload', 'utf-8');
    const signature = crypto
      .createHmac('sha256', 'test-secret-key')
      .update(body)
      .digest('hex');

    expect(() => service.verifySignature(body, signature)).not.toThrow();
  });

  it('should verify valid HMAC signature for string body', () => {
    const body = 'plain text payload';
    const signature = crypto
      .createHmac('sha256', 'test-secret-key')
      .update(body)
      .digest('hex');

    expect(() => service.verifySignature(body, signature)).not.toThrow();
  });

  it('should throw UnauthorizedException for invalid signature', () => {
    const body = { event: 'test' };
    const invalidSignature = 'invalid-signature-hex';

    expect(() => service.verifySignature(body, invalidSignature)).toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException if signature is missing', () => {
    const body = { event: 'test' };

    expect(() => service.verifySignature(body, undefined)).toThrow(
      UnauthorizedException,
    );
  });

  it('should accept any payload if WEBHOOK_HMAC_SECRET is not set', () => {
    delete process.env.WEBHOOK_HMAC_SECRET;

    // Recreate service without secret
    const noSecretService = new WebhooksService();
    const body = { event: 'test' };

    expect(() =>
      noSecretService.verifySignature(body, undefined),
    ).not.toThrow();

    // Restore secret
    process.env.WEBHOOK_HMAC_SECRET = 'test-secret-key';
  });
});
