import { ZkController } from './zk.controller';
import { ZkService } from './zk.service';

describe('ZkController', () => {
  let controller: ZkController;
  let service: jest.Mocked<ZkService>;

  beforeEach(() => {
    service = {
      verify: jest.fn(),
      getScore: jest.fn(),
    } as unknown as jest.Mocked<ZkService>;

    controller = new ZkController(service);
  });

  it('delegates verify to service', async () => {
    const dto: any = { proof: 'p' };
    service.verify.mockResolvedValue({ ok: true } as any);

    const result = await controller.verify(dto);

    expect(service.verify).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ ok: true });
  });

  it('returns score from service', async () => {
    service.getScore.mockResolvedValue({ score: 720 } as any);

    const result = await controller.getScore('GABC');

    expect(service.getScore).toHaveBeenCalledWith('GABC');
    expect(result).toEqual({ score: 720 });
  });
});
