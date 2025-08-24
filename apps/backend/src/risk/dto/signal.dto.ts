import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class SignalItemDto {
  @ApiProperty({
    description: 'Tipo do sinal',
    examples: ['whale_move', 'rug_pull', 'sentiment', 'defi_alert'],
  })
  @IsString()
  type!: string;

  @ApiPropertyOptional({ description: 'Payload específico do sinal' })
  @IsOptional()
  payload?: any;
}

export class IngestSignalsDto {
  @ApiProperty({ type: [SignalItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SignalItemDto)
  signals!: SignalItemDto[];

  @ApiPropertyOptional({ description: 'Contexto adicional' })
  @IsOptional()
  context?: any;
}
