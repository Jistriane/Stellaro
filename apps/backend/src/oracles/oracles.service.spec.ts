import { Test } from '@nestjs/testing';
import { OraclesService } from './oracles.service';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';

describe('OraclesService', () => {
  let service;
  let redisService;

  beforeAll(async () => {
    redisService = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
    };

    const module = await Test.createTestingModule({
      providers: [
        OraclesService,
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('https://api.test') } },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    service = module.get(OraclesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
