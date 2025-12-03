import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ReflectorService } from './reflector.service';
import { ReflectorController } from './reflector.controller';

@Module({
  imports: [HttpModule],
  providers: [ReflectorService],
  controllers: [ReflectorController],
  exports: [ReflectorService],
})
export class ReflectorModule {}
