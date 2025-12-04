import { Controller, Get, Header } from '@nestjs/common';

@Controller('metrics')
export class MetricsController {
  @Get()
  @Header('Content-Type', 'text/plain')
  getMetrics(): string {
    // Minimal placeholder metrics; replace with prom-client later
    const lines = [
      '# HELP stellaro_requests_total Total number of backend requests',
      '# TYPE stellaro_requests_total counter',
      'stellaro_requests_total{service="backend"} 0',
      '# HELP stellaro_build_info Build information',
      '# TYPE stellaro_build_info gauge',
      'stellaro_build_info{version="0.0.1"} 1',
    ];
    return lines.join('\n') + '\n';
  }
}
