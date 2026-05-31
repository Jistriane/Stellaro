import { Test } from '@nestjs/testing';
import { ScoreController } from './score.controller';
import { ScoreService } from './score.service';

describe('ScoreController', () => {
  let controller;
  let scoreService;

  beforeEach(async () => {
    const mockScoreService = {
      getUserScore: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [ScoreController],
      providers: [{ provide: ScoreService, useValue: mockScoreService }],
    }).compile();

    controller = module.get(ScoreController);
    scoreService = module.get(ScoreService);
  });

  describe('getUserScore', () => {
    it('should return user score', () => {
      const mockScore = {
        userId: 'user123',
        score: 750,
        factors: { payment: 0.8, credit: 0.7 },
      };

      scoreService.getUserScore.mockReturnValueOnce(mockScore);

      const result = controller.getUserScore('user123');

      expect(result).toEqual(mockScore);
      expect(scoreService.getUserScore).toHaveBeenCalledWith('user123');
    });

    it('should handle different user IDs', () => {
      const mockScore = {
        userId: 'user456',
        score: 650,
        factors: { payment: 0.6, credit: 0.65 },
      };

      scoreService.getUserScore.mockReturnValueOnce(mockScore);

      const result = controller.getUserScore('user456');

      expect(result.userId).toBe('user456');
      expect(result.score).toBe(650);
    });

    it('should pass userId parameter correctly', () => {
      scoreService.getUserScore.mockReturnValueOnce({
        userId: 'test',
        score: 700,
        factors: {},
      });

      controller.getUserScore('test');

      expect(scoreService.getUserScore).toHaveBeenCalledTimes(1);
      expect(scoreService.getUserScore).toHaveBeenCalledWith('test');
    });
  });
});
