import { Injectable } from '@nestjs/common';
import { SorobanService } from '../chain/soroban.service';

@Injectable()
export class InsuranceService {
  constructor(private readonly soroban: SorobanService) {}

  async deposit(userSecret: string, amount: string) {
    return this.soroban.depositInsurance(userSecret, amount);
  }

  async getOverview() {
    return {
      module: 'insurance',
      status: 'integrated-with-soroban',
      readiness: 0.8,
      items: [],
      nextSteps: [
        'Adicionar cálculo atuarial dinâmico',
        'Implementar triggers de liquidação via oráculo',
      ],
    };
  }
}
