import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class ElizaGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const secret = req.headers['x-eliza-secret'] as string | undefined;
    const expected = process.env.ELIZA_WEBHOOK_SECRET;
    if (!expected) throw new ForbiddenException('eliza_secret_not_configured');
    if (!secret || secret !== expected)
      throw new ForbiddenException('eliza_unauthorized');
    return true;
  }
}
