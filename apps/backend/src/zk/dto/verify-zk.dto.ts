import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class VerifyZkDto {
  @ApiProperty({
    description:
      'Prova Groth16 serializada em hex (512 bytes = 256 bytes para BytesN<256>)',
    example: '0102030405...', // 512 hex chars
  })
  @IsString()
  @IsNotEmpty()
  proof!: string;

  @ApiProperty({
    description:
      'Entradas públicas do circuito em hex (256 bytes = 128 bytes para BytesN<128>)',
    example: '0102030405...',
  })
  @IsString()
  @IsNotEmpty()
  publicInputs!: string;

  @ApiProperty({
    description:
      'Pontuação atestada pelo provador (deve corresponder ao circuito)',
  })
  @IsInt()
  @Min(0)
  score!: number;

  @ApiProperty({
    description:
      'Nonce único para proteção de replay (32 hex chars = 16 bytes)',
    example: '0102030405060708090a0b0c0d0e0f10',
  })
  @IsString()
  @IsNotEmpty()
  nonce!: string;

  @ApiProperty({ description: 'Epoch (ms) de expiração da prova' })
  @IsInt()
  @Min(0)
  expiresAt!: number;

  @ApiProperty({
    description:
      'Endereço Stellar do usuário (opcional, usado para verificação on-chain)',
    example: 'GDHIZHAWV7TC6RKI2KXQ23XVRQ23UPJWSODCQHIRZQO22ANVGH7BM4ZD',
    required: false,
  })
  @IsString()
  @IsOptional()
  userAddress?: string;
}
