import { Body, Controller, Post } from '@nestjs/common';
import { AutomationService } from './automation.service';

@Controller('automation')
export class AutomationController {
  constructor(private readonly automation: AutomationService) {}

  @Post('risk')
  risk(
    @Body() body: { asset: string; thresholdBps: number; notifyTo?: string },
  ) {
    return this.automation.riskPipeline(body);
  }

  @Post('onboarding')
  onboarding(
    @Body() body: { document: string; name: string; notifyTo?: string },
  ) {
    return this.automation.onboardingPipeline(body);
  }

  @Post('compliance')
  compliance(@Body() body: { address: string; notifyTo?: string }) {
    return this.automation.compliancePipeline(body);
  }

  @Post('credit')
  credit(@Body() body: { userId: string; income?: number; notifyTo?: string }) {
    return this.automation.creditPipeline(body);
  }

  @Post('reports')
  reports(@Body() body: { lang: 'pt' | 'en'; notifyTo?: string }) {
    return this.automation.reportsPipeline(body);
  }
}
