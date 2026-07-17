import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { QuoteSource } from '@prisma/client';

export class CreateOrderDto {
  @IsUUID()
  quoteId!: string;

  @IsOptional()
  @IsUUID()
  walletId?: string;

  @IsOptional()
  @IsEnum(QuoteSource)
  route?: QuoteSource;

  @IsOptional()
  @IsString()
  clientRequestId?: string;
}
