import { IsNotEmpty, IsString } from 'class-validator';

export class IssueNonceDto {
  @IsString()
  @IsNotEmpty()
  pubkey!: string;
}

export class VerifyWalletDto {
  @IsString()
  @IsNotEmpty()
  pubkey!: string;

  @IsString()
  @IsNotEmpty()
  nonce!: string;

  @IsString()
  @IsNotEmpty()
  signature!: string; // base64-encoded signature

  // opcional: identifica o provedor de carteira (p.ex. 'freighter', 'albedo')
  @IsString()
  provider?: string;
}
