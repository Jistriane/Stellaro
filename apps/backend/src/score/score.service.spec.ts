import { Test } from '@nestjs/testing';
import { ScoreService } from './score.service';

describe('ScoreService', () => {
  let service;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ScoreService],
    }).compile();

    service = module.get(ScoreService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserScore', () => {
    it('should return score for valid user', () => {
      const result = service.getUserScore('user123');

      expect(result).toBeDefined();
      expect(result.userId).toBe('user123');
      expect(result.score).toBeDefined();
      expect(typeof result.score).toBe('number');
    });

    it('should return score with factors array', () => {
      const result = service.getUserScore('user456');

      expect(result.factors).toBeDefined();
      expect(Array.isArray(result.factors)).toBe(true);
    });

    it('should return default score of 650', () => {
      const result = service.getUserScore('anyuser');

      expect(result.score).toBe(650);
    });

    it('should handle different user IDs', () => {
      const result1 = service.getUserScore('user1');
      const result2 = service.getUserScore('user2');
      const result3 = service.getUserScore('user3');

      expect(result1.userId).toBe('user1');
      expect(result2.userId).toBe('user2');
      expect(result3.userId).toBe('user3');
    });

    it('should return consistent structure', () => {
      const result = service.getUserScore('test');

      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('factors');
    });
  });
});
