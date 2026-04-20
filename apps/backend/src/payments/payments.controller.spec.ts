import { HttpException } from '@nestjs/common';
import { PaymentsController } from './payments.controller';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let actionsService: { stablecoinTransfer: jest.Mock };

  beforeEach(() => {
    actionsService = {
      stablecoinTransfer: jest.fn(),
    };
    controller = new PaymentsController(actionsService as any);
  });

  it('should keep PIX send stub behavior', async () => {
    const body = {
      userId: 'user-1',
      to: 'pix-key@example.com',
      amount: 120,
      memo: 'pagamento',
    };

    const result = await controller.sendPix(body);

    expect(result).toEqual({ ok: true, provider: 'pix-stub', ...body });
  });

  it('should keep card charge stub behavior', async () => {
    const body = {
      userId: 'user-1',
      pan_last4: '1234',
      amount: 200,
      currency: 'BRL',
      descriptor: 'STELLARO',
    };

    const result = await controller.chargeCard(body);

    expect(result).toEqual({ ok: true, provider: 'card-stub', ...body });
  });

  it('should call stablecoinTransfer for settlement', async () => {
    actionsService.stablecoinTransfer.mockResolvedValueOnce({
      ok: true,
      method: 'transfer',
      txHash: 'tx-123',
    });

    const result = await controller.settleStablecoin({
      from: 'GFROM123',
      to: 'GTO123',
      amount: '50',
      dryRun: true,
      userId: 'user-1',
      proposalId: 'proposal-1',
    });

    expect(actionsService.stablecoinTransfer).toHaveBeenCalledWith({
      from: 'GFROM123',
      to: 'GTO123',
      amount: '50',
      dryRun: true,
      userId: 'user-1',
      proposalId: 'proposal-1',
    });
    expect(result).toEqual({
      ok: true,
      method: 'transfer',
      txHash: 'tx-123',
    });
  });

  it('should default dryRun to false in settlement', async () => {
    actionsService.stablecoinTransfer.mockResolvedValueOnce({ ok: true });

    await controller.settleStablecoin({
      from: 'GFROM123',
      to: 'GTO123',
      amount: 10,
    });

    expect(actionsService.stablecoinTransfer).toHaveBeenCalledWith({
      from: 'GFROM123',
      to: 'GTO123',
      amount: 10,
      dryRun: false,
      userId: undefined,
      proposalId: undefined,
    });
  });

  it('should reject invalid settlement body', async () => {
    await expect(
      controller.settleStablecoin({
        from: '',
        to: 'GTO123',
        amount: '10',
      } as any),
    ).rejects.toBeInstanceOf(HttpException);

    await expect(
      controller.settleStablecoin({
        from: 'GFROM123',
        to: '',
        amount: '10',
      } as any),
    ).rejects.toBeInstanceOf(HttpException);

    await expect(
      controller.settleStablecoin({
        from: 'GFROM123',
        to: 'GTO123',
        amount: undefined,
      } as any),
    ).rejects.toBeInstanceOf(HttpException);
  });
});
