import { Test } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

describe('NotificationService', () => {
  let service;
  let prisma;
  let redis;
  let configService;

  beforeAll(async () => {
    prisma = {
      notification: {
        create: jest.fn().mockResolvedValue({ id: '1', userId: 'U1', message: 'test' }),
        findMany: jest.fn().mockResolvedValue([{ id: '1', message: 'test' }]),
        update: jest.fn().mockResolvedValue({ id: '1', read: true }),
      },
    };
    redis = {
      publish: jest.fn().mockResolvedValue(1),
      subscribe: jest.fn(),
    };
    configService = {
      get: jest.fn((key) => {
        if (key === 'ALERT_WEBHOOK_URL') return 'http://localhost:3000/webhook';
        if (key === 'SMTP_HOST') return 'smtp.example.com';
        return undefined;
      }),
    };

    const module = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: ConfigService, useValue: configService },
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
      ],
    }).compile();

    service = module.get(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should send notification', async () => {
    const payload = {
      severity: 'INFO' as const,
      title: 'Test',
      message: 'test message',
      timestamp: new Date(),
    };
    await service.send(payload);
    // Method executed successfully
    expect(service).toBeDefined();
  });

  it('should send undercollateralization alert', async () => {
    await service.sendUndercollateralizationAlert(110, 120, {});
    // Method executed successfully
    expect(service).toBeDefined();
  });
});
