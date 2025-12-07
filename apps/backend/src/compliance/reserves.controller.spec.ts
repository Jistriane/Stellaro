import { ReservesController } from './reserves.controller';
import { ReserveManagerService } from './reserve-manager.service';

describe('ReservesController', () => {
  let controller: ReservesController;
  let service: jest.Mocked<ReserveManagerService>;

  beforeEach(() => {
    service = {
      checkCollateralization: jest.fn(),
      generateProofOfReserves: jest.fn(),
      getCurrentSnapshot: jest.fn(),
    } as unknown as jest.Mocked<ReserveManagerService>;

    controller = new ReservesController(service);
  });

  it('delegates check reserves', async () => {
    service.checkCollateralization.mockResolvedValue({ ok: true } as any);
    const res = await controller.checkReserves();
    expect(service.checkCollateralization).toHaveBeenCalledTimes(1);
    expect(res).toEqual({ ok: true });
  });

  it('delegates generate proof', async () => {
    service.generateProofOfReserves.mockResolvedValue({ hash: 'h' } as any);
    const res = await controller.generateProof();
    expect(service.generateProofOfReserves).toHaveBeenCalledTimes(1);
    expect(res).toEqual({ hash: 'h' });
  });

  it('delegates snapshot', async () => {
    service.getCurrentSnapshot.mockResolvedValue({ assets: [] } as any);
    const res = await controller.getSnapshot();
    expect(service.getCurrentSnapshot).toHaveBeenCalledTimes(1);
    expect(res).toEqual({ assets: [] });
  });
});
