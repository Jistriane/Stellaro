import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ZkService } from './zk.service';
import { ZkController } from './zk.controller';

@Module({
  imports: [ConfigModule],
  controllers: [ZkController],
  providers: [ZkService],
  exports: [ZkService],
})
export class ZkModule {}
