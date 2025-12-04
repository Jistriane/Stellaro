import { Test } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsController', () => {
  let controller;
  let service;

  beforeAll(async () => {
    service = {
      getOverview: jest.fn().mockResolvedValue({ totalValue: 1000 }),
      getStablecoin: jest.fn().mockResolvedValue({ supply: 500 }),
    };

    const module = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [{ provide: AnalyticsService, useValue: service }],
    }).compile();

    controller = module.get(AnalyticsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('overview should call service.getOverview', async () => {
    const result = await controller.overview();
    expect(service.getOverview).toHaveBeenCalled();
    expect(result).toEqual({ totalValue: 1000 });
  });

  it('stablecoin should call service.getStablecoin with contractId', async () => {
    const result = await controller.stablecoin('CONTRACT123');
    expect(service.getStablecoin).toHaveBeenCalledWith('CONTRACT123');
    expect(result).toEqual({ supply: 500 });
  });
});
