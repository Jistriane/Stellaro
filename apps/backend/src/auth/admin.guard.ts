import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const token = (req.headers['x-admin-token'] ||
      req.headers['X-Admin-Token']) as string | undefined;
    if (!token || token !== process.env.ADMIN_TOKEN)
      throw new ForbiddenException('admin_only');
    return true;
  }
}
