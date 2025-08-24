import { Module } from '@nestjs/common';
import { WalletsController } from './wallets.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletsService } from './wallets.service';

@Module({
  imports: [PrismaModule],
  controllers: [WalletsController],
  providers: [WalletsService],
})
export class WalletsModule {}
