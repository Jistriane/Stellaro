import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { ComplianceService } from '../compliance/compliance.service';

@Injectable()
export class ComplianceGuard implements CanActivate {
  constructor(private readonly compliance: ComplianceService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId: string | undefined =
      request.body?.userId || request.query?.userId;
    if (!userId)
      throw new ForbiddenException('userId é obrigatório para esta rota');

    const res = await this.compliance.canRoutePixOrCard(userId);
    if (!res.ok || !res.allowed) {
      throw new ForbiddenException('Rota bloqueada por compliance');
    }
    return true;
  }
}
