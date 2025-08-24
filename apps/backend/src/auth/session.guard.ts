import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly redis: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const auth = (req.headers['authorization'] ||
      req.headers['Authorization']) as string | undefined;
    if (!auth || !auth.startsWith('Bearer '))
      throw new UnauthorizedException('missing_bearer');
    const token = auth.substring('Bearer '.length).trim();
    const session = await this.redis.get<{ userId: string }>(`sess:${token}`);
    if (!session) throw new UnauthorizedException('invalid_session');
    // bloqueio
    const isBlocked = await this.redis.get<{ reason?: string }>(
      `block:user:${session.userId}`,
    );
    if (isBlocked) throw new ForbiddenException('user_blocked');
    req.user = { id: session.userId, token };
    return true;
  }
}
