import { Test, TestingModule } from '@nestjs/testing';
import { SecurityService } from './security.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { PasskeyService } from '../passkey/passkey.service';

describe('SecurityService', () => {
  let mod: TestingModule;
  let service: SecurityService;

  const prismaStub = {
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: 'log-1' }),
    },
  };
  const redisStub = {
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(1),
  };
  const passkeyStub = {
    revokeUserSessions: jest.fn().mockResolvedValue({ ok: true }),
  };

  beforeAll(async () => {
    mod = await Test.createTestingModule({
      providers: [
        SecurityService,
        { provide: PrismaService, useValue: prismaStub },
        { provide: RedisService, useValue: redisStub },
        { provide: PasskeyService, useValue: passkeyStub },
      ],
    }).compile();

    service = mod.get<SecurityService>(SecurityService);
  });

  afterAll(async () => {
    await mod.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should block user with reason and revoke sessions', async () => {
    const res = await service.blockUser('user-1', 'suspicious_activity');
    expect(res.ok).toBe(true);
    expect(redisStub.set).toHaveBeenCalledWith(
      'block:user:user-1',
      expect.objectContaining({ reason: 'suspicious_activity' }),
      24 * 3600,
    );
    expect(passkeyStub.revokeUserSessions).toHaveBeenCalledWith('user-1');
  });

  it('should block user with default reason if not provided', async () => {
    const res = await service.blockUser('user-2');
    expect(res.ok).toBe(true);
    expect(redisStub.set).toHaveBeenCalledWith(
      'block:user:user-2',
      expect.objectContaining({ reason: 'blocked_by_admin' }),
      24 * 3600,
    );
  });

  it('should unblock user by deleting Redis key', async () => {
    const res = await service.unblockUser('user-1');
    expect(res.ok).toBe(true);
    expect(redisStub.del).toHaveBeenCalledWith('block:user:user-1');
  });

  it('should revoke user sessions via PasskeyService', async () => {
    const res = await service.revokeSessions('user-3');
    expect(res.ok).toBe(true);
    expect(passkeyStub.revokeUserSessions).toHaveBeenCalledWith('user-3');
  });

  it('should rotate tokens and log audit event', async () => {
    const res = await service.rotateTokens('user-4');
    expect(res.ok).toBe(true);
    expect(prismaStub.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-4',
        channel: 'BOTH',
        level: 'WARN',
        action: 'TOKEN_ROTATION_EXECUTED',
      }),
    });
  });
});
