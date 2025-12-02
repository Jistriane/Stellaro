import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class SorobanService {
  private readonly logger = new Logger(SorobanService.name);
  private readonly client: AxiosInstance;

  constructor() {
    const baseURL = process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
    this.client = axios.create({ baseURL, timeout: 10000 });
  }

  async getEvents(contractId: string, startLedger?: number, endLedger?: number, paginationToken?: string) {
    // Soroban JSON-RPC: "getEvents"
    const payload: any = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'getEvents',
      params: {
        startLedger: startLedger ?? 0,
        filters: [{ type: 'contract', contractIds: [contractId] }],
      },
    };
    if (endLedger) payload.params.endLedger = endLedger;
    if (paginationToken) payload.params.paginationToken = paginationToken;

    const { data } = await this.client.post('', payload);
    if (data.error) throw new Error(data.error?.message || 'Soroban RPC error');
    return data.result;
  }
}
