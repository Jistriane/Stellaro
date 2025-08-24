import { Module } from '@nestjs/common';
import { DefiService } from './defi.service';
import { DefiController } from './defi.controller';
import { ChainModule } from '../chain/chain.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SecurityModule } from '../security/security.module';

@Module({
  imports: [ChainModule, PrismaModule, SecurityModule],
  providers: [DefiService],
  controllers: [DefiController],
})
export class DefiModule {}
