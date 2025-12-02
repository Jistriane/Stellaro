import { Module } from '@nestjs/common';
import { DefiService } from './defi.service';
import { DefiController } from './defi.controller';
import { BlendPositionsController } from './blend/positions.controller';
import { BlendPositionsService } from './blend/positions.service';
import { BlendYieldService } from './blend-yield.service';
import { ChainModule } from '../chain/chain.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SecurityModule } from '../security/security.module';

@Module({
  imports: [ChainModule, PrismaModule, SecurityModule],
  providers: [DefiService, BlendYieldService, BlendPositionsService],
  controllers: [DefiController, BlendPositionsController],
  exports: [BlendYieldService],
})
export class DefiModule {}
