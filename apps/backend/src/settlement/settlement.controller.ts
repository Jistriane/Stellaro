import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../auth/jwt.guard';
import { User } from '../auth/user.decorator';
import { SettlementService } from './settlement.service';

type JwtUser = { id: string };

@ApiTags('settlement')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('settlements')
export class SettlementController {
  constructor(private readonly settlementService: SettlementService) {}

  @Get()
  @ApiOperation({ summary: 'Lista settlements do usuario autenticado' })
  async list(
    @User() user: JwtUser,
    @Query('limit') limit?: string,
  ) {
    const take = limit ? Number(limit) : undefined;
    const settlements = await this.settlementService.listByUser(
      user.id,
      Number.isFinite(take) ? take : undefined,
    );
    return { ok: true, settlements };
  }

  @Get('status')
  @ApiOperation({ summary: 'Retorna status do provider de settlement' })
  getStatus() {
    return this.settlementService.getProviderStatus();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um settlement do usuario autenticado' })
  async getById(@User() user: JwtUser, @Param('id') id: string) {
    const settlement = await this.settlementService.getByIdForUser(user.id, id);
    return { ok: true, settlement };
  }

  @Post(':id/retry')
  @ApiOperation({ summary: 'Reenvia ou continua o broadcast de um settlement pendente' })
  async retry(@User() user: JwtUser, @Param('id') id: string) {
    await this.settlementService.getByIdForUser(user.id, id);
    const settlement = await this.settlementService.broadcastPendingSettlement(id);
    return { ok: true, settlement };
  }
}
