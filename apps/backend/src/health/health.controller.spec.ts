import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return ok status and fields', () => {
    const res = controller.get();
    expect(res.status).toBe('ok');
    expect(typeof res.uptime).toBe('number');
    expect(typeof res.timestamp).toBe('string');
  });
});
