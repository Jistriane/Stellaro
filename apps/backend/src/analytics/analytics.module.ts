import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { IngestorService } from './ingestor.service';
import { AnalyticsController } from './analytics.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [AnalyticsService, IngestorService],
  controllers: [AnalyticsController],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
