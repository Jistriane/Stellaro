import { Test } from '@nestjs/testing';
import { MemoryService } from './memory.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MemoryService', () => {
  let service;
  let prisma;

  beforeEach(async () => {
    const mockPrisma = {
      riskEvent: {
        create: jest.fn(),
      },
      riskProposal: {
        create: jest.fn(),
      },
      riskExecution: {
        create: jest.fn(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        MemoryService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(MemoryService);
    prisma = module.get(PrismaService);
  });

  describe('history', () => {
    it('should return empty events array for user', () => {
      const result = service.history('user123');
      expect(result).toEqual({ userId: 'user123', events: [] });
    });

    it('should return consistent structure', () => {
      const result = service.history('any-user');
      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('events');
      expect(Array.isArray(result.events)).toBe(true);
    });
  });

  describe('logEvent', () => {
    it('should log SIGNAL_INGEST event successfully', async () => {
      prisma.riskEvent.create.mockResolvedValueOnce({ id: 1 });
      const result = await service.logEvent('user1', 'SIGNAL_INGEST', { price: 100 });
      expect(result).toEqual({ ok: true, id: 1 });
      expect(prisma.riskEvent.create).toHaveBeenCalledWith({
        data: {
          userId: 'user1',
          type: 'SIGNAL_INGEST',
          payload: { price: 100 },
        },
      });
    });

    it('should log DECISION_MADE event successfully', async () => {
      prisma.riskEvent.create.mockResolvedValueOnce({ id: 2 });
      const result = await service.logEvent('user2', 'DECISION_MADE', { action: 'swap' });
      expect(result.ok).toBe(true);
      expect(result.id).toBe(2);
    });

    it('should log ACTION_EXECUTED event successfully', async () => {
      prisma.riskEvent.create.mockResolvedValueOnce({ id: 3 });
      const result = await service.logEvent('user3', 'ACTION_EXECUTED', { success: true });
      expect(result).toEqual({ ok: true, id: 3 });
    });

    it('should handle custom event types', async () => {
      prisma.riskEvent.create.mockResolvedValueOnce({ id: 4 });
      const result = await service.logEvent('user4', 'CUSTOM_EVENT', { data: 'test' });
      expect(result.ok).toBe(true);
      expect(prisma.riskEvent.create).toHaveBeenCalledWith({
        data: {
          userId: 'user4',
          type: 'CUSTOM_EVENT',
          payload: { data: 'test' },
        },
      });
    });

    it('should return ok:false on database error', async () => {
      prisma.riskEvent.create.mockRejectedValueOnce(new Error('DB error'));
      const result = await service.logEvent('user5', 'SIGNAL_INGEST', {});
      expect(result).toEqual({ ok: false });
    });
  });

  describe('recordProposal', () => {
    it('should record proposal successfully', async () => {
      prisma.riskProposal.create.mockResolvedValueOnce({ id: 10 });
      prisma.riskEvent.create.mockResolvedValueOnce({ id: 11 });

      const proposal = {
        proposalId: 'prop-123',
        confidence: 0.85,
        actions: [{ type: 'swap' }],
      };

      const result = await service.recordProposal('user10', proposal);
      expect(result).toEqual({ ok: true, id: 10 });
      expect(prisma.riskProposal.create).toHaveBeenCalledWith({
        data: {
          userId: 'user10',
          proposalId: 'prop-123',
          confidence: 0.85,
          actions: [{ type: 'swap' }],
        },
      });
    });

    it('should handle low confidence proposals', async () => {
      prisma.riskProposal.create.mockResolvedValueOnce({ id: 12 });
      const proposal = { proposalId: 'prop-low', confidence: 0.3, actions: [] };
      const result = await service.recordProposal('user11', proposal);
      expect(result.ok).toBe(true);
    });

    it('should return ok:false on database error', async () => {
      prisma.riskProposal.create.mockRejectedValueOnce(new Error('DB error'));
      const proposal = { proposalId: 'prop-fail', confidence: 0.9, actions: [] };
      const result = await service.recordProposal('user12', proposal);
      expect(result).toEqual({ ok: false });
    });
  });

  describe('recordExecution', () => {
    it('should record successful execution with proposalId', async () => {
      prisma.riskExecution.create.mockResolvedValueOnce({ id: 20 });
      prisma.riskEvent.create.mockResolvedValueOnce({ id: 21 });

      const input = {
        userId: 'user20',
        proposalId: 'prop-exec',
        action: 'swap',
        params: { from: 'USDC', to: 'XLM' },
        executed: true,
      };

      const result = await service.recordExecution(input);
      expect(result).toEqual({ ok: true, id: 20 });
      expect(prisma.riskExecution.create).toHaveBeenCalledWith({
        data: {
          userId: 'user20',
          proposalId: 'prop-exec',
          action: 'swap',
          params: { from: 'USDC', to: 'XLM' },
          executed: true,
        },
      });
    });

    it('should record execution without proposalId', async () => {
      prisma.riskExecution.create.mockResolvedValueOnce({ id: 22 });
      const input = {
        userId: 'user21',
        action: 'stake',
        params: { amount: 1000 },
        executed: true,
      };
      const result = await service.recordExecution(input);
      expect(result.ok).toBe(true);
    });

    it('should record failed execution', async () => {
      prisma.riskExecution.create.mockResolvedValueOnce({ id: 23 });
      const input = {
        userId: 'user22',
        action: 'withdraw',
        params: {},
        executed: false,
      };
      const result = await service.recordExecution(input);
      expect(result).toEqual({ ok: true, id: 23 });
    });

    it('should return ok:false on database error', async () => {
      prisma.riskExecution.create.mockRejectedValueOnce(new Error('DB error'));
      const input = {
        userId: 'user23',
        action: 'test',
        params: {},
        executed: true,
      };
      const result = await service.recordExecution(input);
      expect(result).toEqual({ ok: false });
    });
  });
});
