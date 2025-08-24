import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExecuteDto {
  @ApiProperty({ description: 'ID do usuário' })
  @IsString()
  userId!: string;

  @ApiProperty({
    enum: [
      'swap',
      'partialLiquidation',
      'autoHedge',
      'stableMigration',
      'cardBlock',
    ],
  })
  @IsIn([
    'swap',
    'partialLiquidation',
    'autoHedge',
    'stableMigration',
    'cardBlock',
  ])
  action!: string;

  @ApiProperty({ description: 'Parâmetros específicos da ação' })
  @IsObject()
  params!: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'ID da proposta gerada no decide' })
  @IsOptional()
  @IsString()
  proposalId?: string;
}
