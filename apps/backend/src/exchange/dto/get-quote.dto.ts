import { IsEnum, IsNumberString, IsString } from 'class-validator';
import { QuoteSide } from '@prisma/client';

export class GetQuoteDto {
  @IsString()
  from!: string;

  @IsString()
  to!: string;

  @IsNumberString()
  amount!: string;

  @IsEnum(QuoteSide)
  side!: QuoteSide;
}
