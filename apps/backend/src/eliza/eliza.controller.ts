import { Controller, Get, Post, Body, Param } from '@nestjs/common';
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

  // ============================================
  // Multi-Agent Orchestration Endpoints
  // ============================================

  @Post('agents/risk-analysis/:address')
  @ApiOperation({ summary: 'Trigger Stellaro analysis for user portfolio' })
  async triggerRiskAnalysis(@Param('address') address: string) {
    return this.eliza.triggerAgentAction('stellaro', 'analyze_portfolio', {
      userAddress: address,
    });
  }

  @Post('agents/treasury-optimize/:address')
  @ApiOperation({ summary: 'Trigger TreasuryManager optimization' })
  async triggerTreasuryOptimization(@Param('address') address: string) {
    return this.eliza.triggerAgentAction('treasury_manager', 'optimize_yield', {
      treasuryAddress: address,
    });
  }

  @Post('agents/compliance-check')
  @ApiOperation({ summary: 'Trigger ComplianceBot transaction check' })
  async triggerComplianceCheck(
    @Body()
    payload: {
      userAddress: string;
      amountUSD: number;
      asset: string;
      destination?: string;
    },
  ) {
    return this.eliza.triggerAgentAction(
      'compliance_bot',
      'check_transaction',
      payload,
    );
  }

  @Post('agents/orchestrate/safe-optimization')
  @ApiOperation({
    summary:
      'Orchestrate safe treasury optimization (Compliance → Risk → Optimization)',
  })
  async orchestrateSafeOptimization(
    @Body() payload: { treasuryAddress: string },
  ) {
    return this.eliza.orchestrateWorkflow('safe_optimization', payload);
  }

  @Post('agents/orchestrate/transaction-compliance')
  @ApiOperation({
    summary:
      'Orchestrate transaction with compliance gate (Compliance → Execute → Risk)',
  })
  async orchestrateTransactionCompliance(
    @Body()
    payload: {
      userAddress: string;
      amountUSD: number;
      asset: string;
      destination?: string;
    },
  ) {
    return this.eliza.orchestrateWorkflow('transaction_compliance', payload);
  }

  @Get('agents/monitor/:address')
  @ApiOperation({
    summary: 'Concurrent monitoring (Risk + AML) with auto-mitigation',
  })
  async monitorAndMitigate(@Param('address') address: string) {
    return this.eliza.orchestrateWorkflow('monitor_mitigate', {
      userAddress: address,
    });
  }
}
