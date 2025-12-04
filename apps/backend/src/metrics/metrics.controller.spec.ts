import { Test, TestingModule } from '@nestjs/testing';
import { MetricsController } from './metrics.controller';

describe('MetricsController', () => {
  let controller: MetricsController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetricsController],
    }).compile();

    controller = module.get<MetricsController>(MetricsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return text/plain metrics in Prometheus format', () => {
    const res = controller.getMetrics();
    expect(typeof res).toBe('string');
    expect(res).toContain('# HELP stellaro_requests_total');
    expect(res).toContain('# TYPE stellaro_requests_total counter');
    expect(res.trim().endsWith('1') || res.trim().endsWith('0')).toBe(true);
  });
});
