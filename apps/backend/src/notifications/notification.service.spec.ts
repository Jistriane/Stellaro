import { Test } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

describe('NotificationService', () => {
  let service;
  let prisma;
  let redis;

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

    const module = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
      ],
    }).compile();

    service = module.get(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create notification', async () => {
    const result = await service.create({ userId: 'U1', message: 'test' });
    expect(prisma.notification.create).toHaveBeenCalled();
  });

  it('should get notifications for user', async () => {
    const result = await service.getForUser('U1');
    expect(prisma.notification.findMany).toHaveBeenCalled();
    expect(Array.isArray(result)).toBe(true);
  });
});
