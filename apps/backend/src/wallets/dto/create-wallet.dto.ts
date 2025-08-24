import { IsEnum, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { WalletNetwork } from './list-wallets.dto';

export class CreateWalletDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  userId!: string;

  @ApiProperty({ example: 'GCLZ...STELLARADDRESS' })
  @IsString()
  address!: string;

  @ApiProperty({ example: 'freighter' })
  @IsString()
  provider!: string; // freighter | albedo | ledger | other

  @ApiProperty({ enum: WalletNetwork })
  @IsEnum(WalletNetwork)
  network!: WalletNetwork;
}
