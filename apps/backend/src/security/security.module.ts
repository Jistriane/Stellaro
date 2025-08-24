import { Module } from '@nestjs/common';
import { SecurityService } from './security.service';
import { SecurityController } from './security.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { PasskeyModule } from '../passkey/passkey.module';
import { SessionGuard } from '../auth/session.guard';
import { MfaGuard } from '../auth/mfa.guard';
import { AdminGuard } from '../auth/admin.guard';
import { HsmService } from './hsm.service';
import { ElizaGuard } from '../auth/eliza.guard';
import { RiskController } from './risk.controller';

@Module({
  imports: [PrismaModule, RedisModule, PasskeyModule],
  providers: [
    SecurityService,
    SessionGuard,
    MfaGuard,
    AdminGuard,
    HsmService,
    ElizaGuard,
  ],
  controllers: [SecurityController, RiskController],
  exports: [
    SecurityService,
    SessionGuard,
    MfaGuard,
    AdminGuard,
    HsmService,
    ElizaGuard,
  ],
})
export class SecurityModule {}
