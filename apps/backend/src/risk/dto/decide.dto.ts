import {
  IsOptional,
  IsString,
  IsArray,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DecideDto {
  @ApiProperty({ description: 'ID do usuário' })
  @IsString()
  userId!: string;

  @ApiPropertyOptional({
    description: 'Preferências do usuário',
    example: ['minimize_volatility', 'limit_gas'],
  })
  @IsOptional()
  @IsArray()
  preferences?: string[]; // ex: ['minimize_volatility', 'limit_gas']

  @ApiPropertyOptional({ description: 'Slippage máxima em %', example: 0.5 })
  @IsOptional()
  @IsNumber()
  maxSlippagePct?: number;

  @ApiPropertyOptional({ description: 'Permite execução automática' })
  @IsOptional()
  @IsBoolean()
  allowAutoExecute?: boolean;
}
