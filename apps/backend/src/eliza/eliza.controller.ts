import { Controller, Get, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ElizaService } from './eliza.service';

@ApiTags('eliza')
@Controller('eliza')
export class ElizaController {
  constructor(private readonly eliza: ElizaService) {}

  @Get('health')
  @ApiOperation({ summary: 'Healthcheck do agente Eliza' })
  @ApiOkResponse({
    schema: {
      properties: {
        running: { type: 'boolean' },
        intervalMs: { type: 'number', nullable: true },
      },
    },
  })
  health() {
    return this.eliza.getStatus();
  }

  @Get('config')
  @ApiOperation({ summary: 'Config corrente da persona do Eliza' })
  @ApiOkResponse({
    schema: {
      properties: { name: { type: 'string' } },
      additionalProperties: true,
    },
  })
  config() {
    return this.eliza.getConfig() ?? {};
  }

  @Post('start')
  @ApiOperation({ summary: 'Inicia o loop do agente' })
  start() {
    return this.eliza.start();
  }

  @Post('stop')
  @ApiOperation({ summary: 'Para o loop do agente' })
  stop() {
    return this.eliza.stop();
  }
}
