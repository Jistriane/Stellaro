import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { GovernanceService } from './governance.service';
import { SessionGuard } from '../auth/session.guard';
import { MfaGuard } from '../auth/mfa.guard';

@Controller('governance')
@UseGuards(SessionGuard)
export class GovernanceController {
  constructor(private readonly service: GovernanceService) {}

  @Post('stablecoin/pause')
  setPause(
    @Body()
    body: {
      stablecoin: string;
      paused: boolean;
      dryRun?: boolean;
      userId?: string;
      proposalId?: string;
    },
  ) {
    return this.service.setPause(body);
  }

  @Post('stablecoin/mint-enabled')
  setMintEnabled(
    @Body()
    body: {
      stablecoin: string;
      enabled: boolean;
      dryRun?: boolean;
      userId?: string;
      proposalId?: string;
    },
  ) {
    return this.service.setMintEnabled(body);
  }

  @Post('stablecoin/burn-enabled')
  setBurnEnabled(
    @Body()
    body: {
      stablecoin: string;
      enabled: boolean;
      dryRun?: boolean;
      userId?: string;
      proposalId?: string;
    },
  ) {
    return this.service.setBurnEnabled(body);
  }

  @Post('stablecoin/risk-threshold')
  setRiskThreshold(
    @Body()
    body: {
      stablecoin: string;
      riskBps: number;
      dryRun?: boolean;
      userId?: string;
      proposalId?: string;
    },
  ) {
    return this.service.setRiskThreshold(body);
  }

  // ===== Governança por Propostas =====
  @Post('propose/flag')
  proposeFlag(
    @Body()
    body: {
      proposer: string;
      target: string;
      method: string;
      value: boolean;
      start: number;
      end: number;
      quorum: number;
      dryRun?: boolean;
      userId?: string;
      proposalId?: string;
    },
  ) {
    return this.service.proposeFlag(body);
  }

  @Post('propose/u32')
  proposeU32(
    @Body()
    body: {
      proposer: string;
      target: string;
      method: string;
      value: number;
      start: number;
      end: number;
      quorum: number;
      dryRun?: boolean;
      userId?: string;
      proposalId?: string;
    },
  ) {
    return this.service.proposeU32(body);
  }

  @Post('vote')
  vote(
    @Body()
    body: {
      voter: string;
      proposalId: number;
      support: boolean;
      weight: number;
      dryRun?: boolean;
      userId?: string;
    },
  ) {
    return this.service.vote(body);
  }

  @Post('execute')
  @UseGuards(MfaGuard)
  execute(
    @Body()
    body: {
      proposalId: number;
      dryRun?: boolean;
      userId?: string;
    },
  ) {
    return this.service.execute(body);
  }
}
