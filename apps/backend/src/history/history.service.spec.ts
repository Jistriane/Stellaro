import { Test } from '@nestjs/testing';
import { ComplianceService } from '../compliance/compliance.service';
import { ExchangeService } from '../exchange/exchange.service';
import { PrismaService } from '../prisma/prisma.service';
import { SettlementService } from '../settlement/settlement.service';
import { HistoryService } from './history.service';

describe('HistoryService', () => {
  let service: HistoryService;
  let prisma: any;
  let exchangeService: any;
  let settlementService: any;
  let complianceService: any;

  beforeEach(async () => {
    prisma = {
      exchangeOrder: { findMany: jest.fn() },
      settlement: { findMany: jest.fn() },
      pixPayment: { findMany: jest.fn() },
      pixWithdrawal: { findMany: jest.fn() },
      supportThread: { findMany: jest.fn() },
    };
    exchangeService = { getProviderStatus: jest.fn() };
    settlementService = { getProviderStatus: jest.fn() };
    complianceService = { getTravelRuleProviderStatus: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        HistoryService,
        { provide: PrismaService, useValue: prisma },
        { provide: ExchangeService, useValue: exchangeService },
        { provide: SettlementService, useValue: settlementService },
        { provide: ComplianceService, useValue: complianceService },
      ],
    }).compile();

    service = module.get(HistoryService);
  });

  it('combina orders, PIX e support em ordem cronologica', async () => {
    prisma.exchangeOrder.findMany.mockResolvedValue([
      {
        id: 'order-1',
        status: 'ROUTED',
        side: 'BUY',
        pair: 'BRL/USDT',
        createdAt: new Date('2026-01-03T10:00:00Z'),
        settlements: [],
      },
    ]);
    prisma.settlement.findMany.mockResolvedValue([
      {
        id: 'set-1',
        asset: 'USDT',
        destinationAddress: 'GDEST1234',
        status: 'BROADCASTED',
        createdAt: new Date('2026-01-03T11:00:00Z'),
      },
    ]);
    prisma.pixPayment.findMany.mockResolvedValue([
      {
        id: 'pixdep-1',
        amount: '1000.00',
        status: 'confirmed',
        createdAt: new Date('2026-01-02T10:00:00Z'),
      },
    ]);
    prisma.pixWithdrawal.findMany.mockResolvedValue([]);
    prisma.supportThread.findMany.mockResolvedValue([
      {
        id: 'thread-1',
        status: 'OPEN',
        subject: 'Ajuda',
        updatedAt: new Date('2026-01-04T10:00:00Z'),
        messages: [{ messageText: 'Onde esta minha ordem?' }],
      },
    ]);
    exchangeService.getProviderStatus.mockReturnValue({ mode: 'stub' });
    settlementService.getProviderStatus.mockReturnValue({ mode: 'stub' });
    complianceService.getTravelRuleProviderStatus.mockReturnValue({
      mode: 'stub',
    });

    const result = await service.getUnifiedHistory('user-1', 10);

    expect(result.items).toHaveLength(4);
    expect(result.items[0].type).toBe('support');
    expect(result.items[1].type).toBe('settlement');
    expect(result.items[2].type).toBe('order');
    expect(result.items[3].type).toBe('pix_deposit');
    expect(result.providers.exchange.mode).toBe('stub');
  });
});
