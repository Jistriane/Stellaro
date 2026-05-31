import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { RiskService } from './risk.service';
import { IngestSignalsDto } from './dto/signal.dto';
import { DecideDto } from './dto/decide.dto';
import { ExecuteDto } from './dto/execute.dto';
import { JwtGuard } from '../auth/jwt.guard';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { DecisionProposal, RiskSummary } from './risk.service';
import {
  DecisionProposalResponseDto,
  ExecuteResultResponseDto,
  RiskSummaryResponseDto,
} from './dto/responses.dto';

@ApiTags('risk')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('risk')
export class RiskController {
  constructor(private readonly riskService: RiskService) {}

  @Post('signals')
  @ApiOkResponse({
    description: 'Sinais ingeridos com sucesso',
    schema: {
      type: 'object',
      properties: {
        ok: { type: 'boolean' },
        received: { $ref: '#/components/schemas/IngestSignalsDto' },
      },
    },
  })
  ingestSignals(@Body() body: IngestSignalsDto):
    | {
        ok: boolean;
        received: IngestSignalsDto;
      }
    | Promise<{
        ok: boolean;
        received: IngestSignalsDto;
      }> {
    return this.riskService.ingestSignals(body);
  }

  @Get('summary')
  @ApiOkResponse({ type: RiskSummaryResponseDto })
  getSummary(
    @Query('userId') userId: string,
  ): RiskSummary | Promise<RiskSummary & { events: any[] }> {
    return this.riskService.getSummary(userId);
  }

  @Post('decide')
  @ApiOkResponse({ type: DecisionProposalResponseDto })
  decide(@Body() body: DecideDto): DecisionProposal {
    return this.riskService.decide(body);
  }

  @Post('execute')
  @ApiOkResponse({ type: ExecuteResultResponseDto })
  execute(@Body() body: ExecuteDto): {
    executed: boolean;
    request: ExecuteDto;
  } {
    return this.riskService.execute(body);
  }
}
