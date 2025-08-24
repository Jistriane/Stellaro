import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class MfaGuard implements CanActivate {
  constructor(private readonly redis: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user as { id: string } | undefined;
    if (!user?.id) throw new ForbiddenException('mfa_user_missing');
    const ok = await this.redis.get<{ ok: boolean; ts: number }>(
      `mfa:ok:${user.id}`,
    );
    if (!ok?.ok) throw new ForbiddenException('mfa_required');
    return true;
  }
}
