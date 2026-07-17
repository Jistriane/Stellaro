import { Injectable } from '@nestjs/common';
import { LedgerDirection } from '@prisma/client';
import { LedgerRepository } from './ledger.repository';

@Injectable()
export class LedgerService {
  constructor(private readonly ledgerRepository: LedgerRepository) {}

  credit(params: {
    userId: string;
    referenceType: string;
    referenceId: string;
    currency: string;
    amount: string;
    description?: string;
    metadata?: object;
  }) {
    return this.ledgerRepository.createEntry({
      ...params,
      direction: LedgerDirection.CREDIT,
    });
  }

  debit(params: {
    userId: string;
    referenceType: string;
    referenceId: string;
    currency: string;
    amount: string;
    description?: string;
    metadata?: object;
  }) {
    return this.ledgerRepository.createEntry({
      ...params,
      direction: LedgerDirection.DEBIT,
    });
  }

  listByUser(userId: string, take?: number) {
    return this.ledgerRepository.listByUser(userId, take);
  }

  getBalanceByUserAndCurrency(userId: string, currency: string) {
    return this.ledgerRepository.getBalanceByUserAndCurrency(userId, currency);
  }
}
