import { Controller, Sse, Get, Post, Body, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RoboAdvisorService } from './robo-advisor.service';

@Controller('v5/risk')
export class RoboAdvisorController {
  constructor(private readonly roboAdvisorService: RoboAdvisorService) {}

  @Sse('threats/stream')
  streamThreats(): Observable<MessageEvent> {
    return this.roboAdvisorService.threatLog$.pipe(
      map(data => ({ data } as MessageEvent))
    );
  }

  @Get('status')
  getStatus() {
    return { isAgentActive: this.roboAdvisorService.isAgentActive };
  }

  @Post('agent/toggle')
  toggleAgent(@Body() body: { isActive: boolean }) {
    this.roboAdvisorService.isAgentActive = body.isActive;
    return { isAgentActive: this.roboAdvisorService.isAgentActive };
  }

  @Post('telemetry')
  reportTelemetry(@Body() body: { type: string; userId: string; status: string; metadata?: any }) {
    return this.roboAdvisorService.reportMobileEvent(body);
  }
}
