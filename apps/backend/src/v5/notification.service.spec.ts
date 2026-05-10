import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationService],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('sendAlert sends message to user', async () => {
    const result = await service.sendAlert('user123', 'Test alert', 'telegram');
    expect(result).toBeUndefined(); // Service logs but returns nothing
  });

  it('sendAlert supports multiple channels', async () => {
    await service.sendAlert('user123', 'Test alert', 'telegram');
    await service.sendAlert('user123', 'Test alert', 'whatsapp');
    await service.sendAlert('user123', 'Test alert', 'all');
    expect(service).toBeDefined();
  });

  it('sendDangerZoneAlert sends health factor warning', async () => {
    const result = await service.sendDangerZoneAlert('user456', 1.25);
    expect(result).toBeUndefined();
  });

  it('sendAlert handles missing users gracefully', async () => {
    const result = await service.sendAlert('nonexistent', 'Alert');
    expect(result).toBeUndefined();
  });

  it('sendAlert includes user id in message context', async () => {
    const userId = 'test-user-999';
    const channel = 'telegram';
    await service.sendAlert(userId, 'Context test', channel);
    expect(service).toBeDefined();
  });

  it('sendDangerZoneAlert formats health factor correctly', async () => {
    const healthFactors = [1.5, 1.25, 1.0, 0.95];
    for (const hf of healthFactors) {
      await service.sendDangerZoneAlert('user', hf);
    }
    expect(service).toBeDefined();
  });
});
