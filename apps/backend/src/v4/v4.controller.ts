import { Controller, Get } from '@nestjs/common';
import { V4Service } from './v4.service';

@Controller('v4')
export class V4Controller {
  constructor(private readonly service: V4Service) {}

  @Get()
  getOverview() {
    return this.service.getOverview();
  }
}
