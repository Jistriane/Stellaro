import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ScoreService } from './score.service';
import { JwtGuard } from '../auth/jwt.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('score')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('score')
export class ScoreController {
  constructor(private readonly scoreService: ScoreService) {}

  @Get('user')
  getUserScore(@Query('userId') userId: string) {
    return this.scoreService.getUserScore(userId);
  }
}
