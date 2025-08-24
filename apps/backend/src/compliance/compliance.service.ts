import { Injectable } from '@nestjs/common';

export interface KycResult {
  ok: boolean;
  level: 'basic' | 'enhanced' | 'denied';
  reasons?: string[];
}

@Injectable()
export class ComplianceService {
  async kycCheck(document: string, name: string): Promise<KycResult> {
    // Stub: aplicar integrações (sumsub, sanction lists, pep, adverse media)
    if (!document || !name)
      return { ok: false, level: 'denied', reasons: ['invalid_input'] };
    return { ok: true, level: 'basic' };
  }

  async amlScreening(
    address: string,
  ): Promise<{ ok: boolean; flagged: boolean; reasons?: string[] }> {
    // Stub: checar listas de sanção e comportamento
    return { ok: true, flagged: false };
  }

  async canRoutePixOrCard(
    userId: string,
  ): Promise<{ ok: boolean; allowed: boolean; level: string }> {
    // Stub: exigir KYC mínimo para PIX/cartões
    return { ok: true, allowed: true, level: 'basic' };
  }
}
