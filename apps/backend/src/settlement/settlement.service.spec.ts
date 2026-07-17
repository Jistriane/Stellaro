import { Test } from '@nestjs/testing';
import { ComplianceService } from '../compliance/compliance.service';
import { OrdersRepository } from '../exchange/orders.repository';
import { SettlementProviderService } from './settlement-provider.service';
import { SettlementsRepository } from './settlements.repository';
import { SettlementService } from './settlement.service';

describe('SettlementService', () => {
  let service: SettlementService;
  let ordersRepository: jest.Mocked<OrdersRepository>;
  let settlementsRepository: jest.Mocked<SettlementsRepository>;
  let provider: jest.Mocked<SettlementProviderService>;
  let complianceService: jest.Mocked<ComplianceService>;

  beforeEach(async () => {
    ordersRepository = {
      findById: jest.fn(),
      markSettling: jest.fn(),
      markSettled: jest.fn(),
    } as unknown as jest.Mocked<OrdersRepository>;

    settlementsRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      listByUser: jest.fn(),
      markBroadcasted: jest.fn(),
      markConfirmed: jest.fn(),
      markFailed: jest.fn(),
      listPending: jest.fn(),
    } as unknown as jest.Mocked<SettlementsRepository>;

    provider = {
      broadcastSettlement: jest.fn(),
      syncSettlement: jest.fn(),
      getStatus: jest.fn(),
    } as unknown as jest.Mocked<SettlementProviderService>;
    complianceService = {
      checkTravelRule: jest.fn(),
    } as unknown as jest.Mocked<ComplianceService>;

    const module = await Test.createTestingModule({
      providers: [
        SettlementService,
        { provide: OrdersRepository, useValue: ordersRepository },
        { provide: SettlementsRepository, useValue: settlementsRepository },
        { provide: SettlementProviderService, useValue: provider },
        { provide: ComplianceService, useValue: complianceService },
      ],
    }).compile();

    service = module.get(SettlementService);
  });

  it('faz broadcast de settlement pendente sem txHash', async () => {
    settlementsRepository.findById.mockResolvedValue({
      id: 'settlement-1',
      orderId: 'order-1',
      chain: 'stellar',
      asset: 'USDC',
      destinationAddress: 'GDEST',
    } as any);
    ordersRepository.findById.mockResolvedValue({
      id: 'order-1',
      userId: 'user-1',
      amountIn: '1000.00',
      amountOut: '190.00',
    } as any);
    complianceService.checkTravelRule.mockResolvedValue({
      ok: true,
      allowed: true,
      status: 'CLEARED',
      reason: null,
    } as any);
    provider.broadcastSettlement.mockResolvedValue({
      txHash: 'tx-123',
      metadata: { mocked: true },
    });
    settlementsRepository.markBroadcasted.mockResolvedValue({
      id: 'settlement-1',
      txHash: 'tx-123',
    } as any);

    await service.broadcastPendingSettlement('settlement-1');

    expect(provider.broadcastSettlement).toHaveBeenCalledWith({
      settlementId: 'settlement-1',
      chain: 'stellar',
      asset: 'USDC',
      destinationAddress: 'GDEST',
      amount: '190.00',
    });
    expect(settlementsRepository.markBroadcasted).toHaveBeenCalledWith(
      'settlement-1',
      'tx-123',
      { mocked: true },
    );
  });

  it('sincroniza e confirma settlement broadcastado', async () => {
    settlementsRepository.listPending.mockResolvedValue([
      {
        id: 'settlement-1',
        txHash: 'tx-123',
      },
    ] as any);
    provider.syncSettlement.mockResolvedValue({
      confirmations: 4,
      confirmed: true,
    });
    settlementsRepository.markConfirmed.mockResolvedValue({
      id: 'settlement-1',
      orderId: 'order-1',
    } as any);
    ordersRepository.findById.mockResolvedValue({
      id: 'order-1',
      amountIn: '1000.00',
      amountOut: '190.00',
    } as any);
    ordersRepository.markSettled.mockResolvedValue({ id: 'order-1' } as any);

    const result = await service.syncPendingSettlements(10);

    expect(provider.syncSettlement).toHaveBeenCalledWith('tx-123');
    expect(ordersRepository.markSettled).toHaveBeenCalledWith(
      'order-1',
      '190.00',
    );
    expect(result).toHaveLength(1);
  });

  it('lista settlements do usuario autenticado', async () => {
    settlementsRepository.listByUser.mockResolvedValue([
      { id: 'settlement-1', order: { userId: 'user-1' } },
    ] as any);

    const result = await service.listByUser('user-1', 5);

    expect(settlementsRepository.listByUser).toHaveBeenCalledWith('user-1', 5);
    expect(result).toHaveLength(1);
  });

  it('impede acesso a settlement de outro usuario', async () => {
    settlementsRepository.findById.mockResolvedValue({
      id: 'settlement-1',
      order: { userId: 'user-2' },
    } as any);

    await expect(
      service.getByIdForUser('user-1', 'settlement-1'),
    ).rejects.toThrow('Settlement does not belong to authenticated user');
  });
});
