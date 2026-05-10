import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ZkService } from './zk.service';
import { ZkController } from './zk.controller';
import { ChainModule } from '../chain/chain.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [ConfigModule, ChainModule, RedisModule],
  controllers: [ZkController],
  providers: [ZkService],
  exports: [ZkService],
})
export class ZkModule {}
