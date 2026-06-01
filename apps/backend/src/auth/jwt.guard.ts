import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

@Injectable()
export class JwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const nodeEnv = process.env.NODE_ENV ?? 'development';
    const jwtSecret = process.env.JWT_SECRET;
    if (nodeEnv.toLowerCase() === 'production' && !jwtSecret) {
      throw new UnauthorizedException('JWT_SECRET is required in production.');
    }

    const req = context.switchToHttp().getRequest<Request>();
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = authHeader.substring('Bearer '.length);
    try {
      const jwt = new JwtService({
        secret: jwtSecret || 'dev-secret',
      });
      const payload: unknown = jwt.verify(token);
      // @ts-expect-error extend request typing with user payload
      req.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
