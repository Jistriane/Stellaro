import { Module } from '@nestjs/common';
import { OraclesService } from './oracles.service';
import { OraclesController } from './oracles.controller';
import { ReflectorOracleService } from './reflector-oracle.service';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [OraclesService, ReflectorOracleService],
  controllers: [OraclesController],
  exports: [OraclesService, ReflectorOracleService],
})
export class OraclesModule {}
