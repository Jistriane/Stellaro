import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { MemoryService } from './memory.service';
import { JwtGuard } from '../auth/jwt.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('memory')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('memory')
export class MemoryController {
  constructor(private readonly memoryService: MemoryService) {}

  @Get('history')
  history(@Query('userId') userId: string) {
    return this.memoryService.history(userId);
  }
}
