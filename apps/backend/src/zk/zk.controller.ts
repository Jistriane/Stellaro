import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ZkService } from './zk.service';
import { VerifyZkDto } from './dto/verify-zk.dto';

@ApiTags('zk')
@Controller('zk')
export class ZkController {
  constructor(private readonly zkService: ZkService) {}

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verifica prova ZK Groth16 e armazena score on-chain',
  })
  @ApiResponse({
    status: 200,
    description: 'Resultado da verificação',
    schema: {
      type: 'object',
      properties: {
        ok: { type: 'boolean' },
        reason: { type: 'string', nullable: true },
      },
    },
  })
  async verify(@Body() dto: VerifyZkDto) {
    return this.zkService.verify(dto);
  }

  @Get('score/:address')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Recupera credit score de um usuário do contrato ZK Verifier',
  })
  @ApiParam({
    name: 'address',
    description: 'Endereço Stellar do usuário (G...)',
  })
  @ApiResponse({
    status: 200,
    description: 'Score do usuário ou erro',
    schema: {
      type: 'object',
      properties: {
        score: { type: 'number', nullable: true },
        error: { type: 'string', nullable: true },
      },
    },
  })
  async getScore(@Param('address') address: string) {
    return this.zkService.getScore(address);
  }
}
