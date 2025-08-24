import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { SecurityService } from './security.service';
import { AdminGuard } from '../auth/admin.guard';

@Controller('security')
@UseGuards(AdminGuard)
export class SecurityController {
  constructor(private readonly service: SecurityService) {}

  @Post('block-user')
  block(@Body() body: { userId: string; reason?: string }) {
    return this.service.blockUser(body.userId, body.reason);
  }

  @Post('unblock-user')
  unblock(@Body() body: { userId: string }) {
    return this.service.unblockUser(body.userId);
  }

  @Post('revoke-sessions')
  revoke(@Body() body: { userId: string }) {
    return this.service.revokeSessions(body.userId);
  }

  @Post('rotate-tokens')
  rotate(@Body() body: { userId: string }) {
    return this.service.rotateTokens(body.userId);
  }
}
