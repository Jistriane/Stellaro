import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class HorizonService {
  private readonly logger = new Logger(HorizonService.name);
  private readonly client: AxiosInstance;

  constructor() {
    const baseURL = process.env.HORIZON_URL || 'https://horizon-testnet.stellar.org';
    this.client = axios.create({ baseURL, timeout: 10000 });
  }

  async getAccount(accountId: string) {
    const url = `/accounts/${accountId}`;
    const { data } = await this.client.get(url);
    return data;
  }

  async listOperations(accountId: string, cursor?: string, limit = 20) {
    const params: Record<string, string | number> = {
      limit,
      order: 'desc',
    };
    if (cursor) params['cursor'] = cursor;
    const url = `/accounts/${accountId}/operations`;
    const { data } = await this.client.get(url, { params });
    return data;
  }

  async listPayments(accountId: string, cursor?: string, limit = 20) {
    const params: Record<string, string | number> = {
      limit,
      order: 'desc',
    };
    if (cursor) params['cursor'] = cursor;
    const url = `/accounts/${accountId}/payments`;
    const { data } = await this.client.get(url, { params });
    return data;
  }
}
