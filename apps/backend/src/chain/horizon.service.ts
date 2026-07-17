import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { getChainRuntimeConfig } from './chain-env';

@Injectable()
export class HorizonService {
  private readonly client: AxiosInstance;

  constructor() {
    const { horizonUrl } = getChainRuntimeConfig();
    const baseURL = horizonUrl;
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
