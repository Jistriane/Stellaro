import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum WalletNetwork {
  testnet = 'testnet',
  mainnet = 'mainnet',
}

export class ListWalletsDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ example: 'freighter' })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({ enum: WalletNetwork })
  @IsOptional()
  @IsEnum(WalletNetwork)
  network?: WalletNetwork;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  skip?: number = 0;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number = 20;
}
