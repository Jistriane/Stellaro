import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class HsmService {
  private readonly logger = new Logger(HsmService.name);

  // Assinatura de operações críticas (stub)
  async signOperation(op: { type: string; payload: unknown }) {
    // Em produção: integrar com HSM real (PKCS#11, CloudHSM, etc.)
    this.logger.warn(`HSM stub sign: ${op.type}`);
    return { ok: true, signature: 'hsm_stub_signature' };
  }
}
