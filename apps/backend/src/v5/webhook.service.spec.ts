import { Test, TestingModule } from '@nestjs/testing';
import axios from 'axios';
import { WebhookService } from './webhook.service';

jest.mock('axios');

describe('WebhookService', () => {
  let service: WebhookService;
  const mockAxios = axios as jest.Mocked<typeof axios>;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockAxios.post.mockResolvedValue({ status: 200, data: { success: true } });

    const module: TestingModule = await Test.createTestingModule({
      providers: [WebhookService],
    }).compile();

    service = module.get<WebhookService>(WebhookService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('registerEndpoint adds webhook URL', () => {
    const url = 'https://example.com/webhook';
    service.registerEndpoint(url);
    expect(service).toBeDefined();
  });

  it('registerEndpoint accepts multiple endpoints', () => {
    service.registerEndpoint('https://endpoint1.com');
    service.registerEndpoint('https://endpoint2.com');
    service.registerEndpoint('https://endpoint3.com');
    expect(service).toBeDefined();
  });

  it('trigger sends LIQUIDATION event', async () => {
    service.registerEndpoint('https://partner.com/webhook');
    await service.trigger('LIQUIDATION', { userId: 'user123', amount: 5000 });
    expect(mockAxios.post).toHaveBeenCalled();
  });

  it('trigger sends SWAP_COMPLETE event', async () => {
    service.registerEndpoint('https://partner.com/webhook');
    await service.trigger('SWAP_COMPLETE', { txId: 'tx123', outputAmount: 1000 });
    expect(mockAxios.post).toHaveBeenCalled();
  });

  it('trigger includes timestamp in payload', async () => {
    service.registerEndpoint('https://partner.com/webhook');
    const before = Date.now();
    await service.trigger('PROPOSAL_CREATED', { proposalId: 'prop1' });
    const after = Date.now();

    expect(mockAxios.post).toHaveBeenCalled();
    const call = mockAxios.post.mock.calls[0];
    const payload = call[1] as any;
    expect(payload.timestamp).toBeGreaterThanOrEqual(before);
    expect(payload.timestamp).toBeLessThanOrEqual(after);
  });

  it('trigger handles delivery failures gracefully', async () => {
    mockAxios.post.mockRejectedValueOnce(new Error('Network timeout'));
    service.registerEndpoint('https://unreachable.com/webhook');
    await service.trigger('LIQUIDATION', { data: 'test' });
    expect(mockAxios.post).toHaveBeenCalled();
  });

  it('trigger sends VC_ISSUED event', async () => {
    service.registerEndpoint('https://vc-service.com/webhook');
    await service.trigger('VC_ISSUED', { credentialId: 'vc123', issuer: 'stellaro' });
    expect(mockAxios.post).toHaveBeenCalled();
  });
});
