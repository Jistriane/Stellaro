import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { PasskeyService } from './passkey.service';

@Controller('passkey')
export class PasskeyController {
  constructor(private readonly service: PasskeyService) {}

  // ==== Registration ====
  @Post('register/init')
  initReg(@Body() body: { userId: string; email: string }) {
    return this.service.initRegistration(body.userId, body.email);
  }

  @Post('register/verify')
  verifyReg(@Body() body: any) {
    return this.service.verifyRegistration(body);
  }

  // ==== Authentication ====
  @Post('login/init')
  initLogin(@Body() body: { email: string }) {
    return this.service.initLogin(body.email);
  }

  @Post('login/verify')
  verifyLogin(@Body() body: any) {
    return this.service.verifyLogin(body);
  }

  // ==== Transaction Signing ====
  @Post('tx/init')
  initTx(@Body() body: { userId: string; memo?: string }) {
    return this.service.initTx(body.userId, body.memo);
  }

  @Post('tx/verify')
  verifyTx(@Body() body: any) {
    return this.service.verifyTx(body);
  }

  // ==== MFA (fallback com carteira) ====
  @Post('mfa/init')
  initMfa(@Body() body: { userId: string }) {
    return this.service.initMfa(body.userId);
  }

  @Post('mfa/verify')
  verifyMfa(@Body() body: any) {
    return this.service.verifyMfa(body);
  }

  // ==== MFA status helpers ====
  @Get('mfa/status')
  mfaStatus(@Query('userId') userId: string) {
    return this.service.getMfaStatus(userId);
  }

  @Post('mfa/clear')
  mfaClear(@Body() body: { userId: string }) {
    return this.service.clearMfa(body.userId);
  }
}
