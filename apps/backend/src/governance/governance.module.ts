import { Module } from '@nestjs/common';
import { GovernanceService } from './governance.service';
import { GovernanceController } from './governance.controller';
import { ChainModule } from '../chain/chain.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SecurityModule } from '../security/security.module';

@Module({
  imports: [ChainModule, PrismaModule, SecurityModule],
  providers: [GovernanceService],
  controllers: [GovernanceController],
})
export class GovernanceModule {}
