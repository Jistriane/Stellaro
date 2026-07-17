import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../auth/jwt.guard';
import { User } from '../auth/user.decorator';
import { GetHistoryDto } from './dto/get-history.dto';
import { HistoryService } from './history.service';

type JwtUser = { id: string };

@ApiTags('history')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get('me')
  @ApiOperation({ summary: 'Retorna historico unificado do usuario autenticado' })
  async me(@User() user: JwtUser, @Query() query: GetHistoryDto) {
    const history = await this.historyService.getUnifiedHistory(
      user.id,
      query.limit,
    );
    return { ok: true, history };
  }
}
