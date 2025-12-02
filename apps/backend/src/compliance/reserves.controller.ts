import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ReserveManagerService } from './reserve-manager.service';

@ApiTags('compliance')
@Controller('compliance/reserves')
export class ReservesController {
  constructor(private readonly reserveManager: ReserveManagerService) {}

  @Get('check')
  @ApiOperation({ summary: 'Verifica estado de colateralização atual' })
  @ApiResponse({
    status: 200,
    description: 'Estado de colateralização e snapshot das reservas',
  })
  async checkReserves() {
    return this.reserveManager.checkCollateralization();
  }

  @Post('proof')
  @ApiOperation({ summary: 'Gera Proof of Reserves on-chain' })
  @ApiResponse({
    status: 201,
    description: 'Hash e txHash do proof publicado',
  })
  async generateProof() {
    return this.reserveManager.generateProofOfReserves();
  }

  @Get('snapshot')
  @ApiOperation({ summary: 'Obtém snapshot atual das reservas' })
  @ApiResponse({
    status: 200,
    description: 'Snapshot detalhado com assets e valores',
  })
  async getSnapshot() {
    return this.reserveManager.getCurrentSnapshot();
  }
}
