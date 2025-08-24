import { Injectable } from '@nestjs/common';

@Injectable()
export class ScoreService {
  getUserScore(userId: string) {
    // TODO: cruzar dados on-chain + off-chain (Chainlink/Data Bridges)
    return { userId, score: 650, factors: [] };
  }
}
