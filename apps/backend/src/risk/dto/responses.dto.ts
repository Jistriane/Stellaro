import { ApiProperty } from '@nestjs/swagger';
import { ExecuteDto } from './execute.dto';

export class RiskSummaryResponseDto {
  @ApiProperty()
  userId!: string;

  @ApiProperty({ type: Object })
  exposure!: Record<string, unknown>;

  @ApiProperty({ enum: ['low', 'neutral', 'high'] })
  riskLevel!: 'low' | 'neutral' | 'high';
}

export class DecisionActionDto {
  @ApiProperty()
  type!: string;

  @ApiProperty({ type: Object, required: false })
  extra?: Record<string, unknown>;
}

export class DecisionProposalResponseDto {
  @ApiProperty()
  proposalId!: string;

  @ApiProperty({ minimum: 0, maximum: 1 })
  confidence!: number;

  @ApiProperty({ type: [DecisionActionDto] })
  actions!: DecisionActionDto[];
}

export class ExecuteResultResponseDto {
  @ApiProperty()
  executed!: boolean;

  @ApiProperty({ type: ExecuteDto })
  request!: ExecuteDto;
}
