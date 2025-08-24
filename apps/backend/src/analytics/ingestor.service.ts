import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class IngestorService implements OnModuleInit {
  private readonly logger = new Logger(IngestorService.name);
  private running = false;
  private lastSeq: number | null = null;

  constructor(
    private prisma: PrismaService,
    private bus: RedisService,
  ) {}

  async onModuleInit() {
    // bootstrap last watermark from DB
    const last = await this.prisma.onchainEvent.findFirst({
      orderBy: { ledgerSeq: 'desc' },
    });
    this.lastSeq = last?.ledgerSeq ?? null;
    this.loop().catch((e) => this.logger.error(e));
  }

  private async loop() {
    if (this.running) return;
    this.running = true;
    try {
      while (true) {
        await this.tick();
        await new Promise((r) => setTimeout(r, 5000)); // 5s polling
      }
    } finally {
      this.running = false;
    }
  }

  private async tick() {
    const rpcUrl = process.env.SOROBAN_RPC_URL;
    if (!rpcUrl) return; // disabled
    try {
      const { SorobanRpc } = require('@stellar/stellar-sdk');
      const server = new SorobanRpc.Server(rpcUrl, {
        allowHttp: rpcUrl.startsWith('http://'),
      });

      // Determine start ledger
      const latest = await server.getLatestLedger();
      const start = this.lastSeq
        ? this.lastSeq + 1
        : Math.max(0, latest.sequence - 1000);
      if (start > latest.sequence) return; // nothing new

      // Filter by known contracts if provided
      const contracts = [
        process.env.GOVERNANCE_CONTRACT_ID,
        process.env.STABLECOIN_CONTRACT_ID,
      ].filter(Boolean) as string[];
      const filterContracts = contracts.length > 0 ? contracts : undefined;

      const resp = await server.getEvents({
        startLedger: start,
        filters:
          filterContracts?.map((id) => ({ contractIds: [id] })) ?? undefined,
      } as any);

      const events = (resp?._embedded?.records ?? []) as any[];
      if (!Array.isArray(events) || events.length === 0) {
        this.lastSeq = latest.sequence;
        return;
      }

      for (const ev of events) {
        const ledgerSeq: number =
          ev.ledger || ev.ledger_sequence || ev.ledgerSeq || 0;
        const network = process.env.STELLAR_NETWORK || 'testnet';
        const contractId: string =
          ev.contract || ev.contract_id || ev.contractId || 'unknown';
        const topics: string[] = (ev.topic || ev.topics || []).map((t: any) =>
          String(t),
        );
        const payload = ev.value || ev.data || ev.payload || {};
        const txHash: string = ev.txHash || ev.transaction_hash || '';
        const ts = ev.created_at ? new Date(ev.created_at) : new Date();

        try {
          await this.prisma.onchainEvent.create({
            data: {
              network,
              contractId,
              topic0: topics[0],
              topic1: topics[1],
              topic2: topics[2],
              topic3: topics[3],
              payload,
              txHash,
              ledgerSeq,
              ts,
            },
          });
        } catch (e) {
          // unique constraints not defined; if duplicates happen we can ignore errors silently
          this.logger.debug(
            `onchainEvent insert error ignored: ${(e as Error).message}`,
          );
        }

        await this.bus.publish('onchain.events', {
          network,
          contractId,
          topics,
          payload,
          txHash,
          ledgerSeq,
          ts,
        });

        // Atualiza espelhos/cache a partir de eventos relevantes
        await this.applyMirrors({ network, contractId, topics, payload });
        if (!this.lastSeq || ledgerSeq > this.lastSeq) this.lastSeq = ledgerSeq;
      }
    } catch (e) {
      // If SDK missing or rpc fails, just log and keep going
      this.logger.warn(`tick error: ${(e as Error).message}`);
    }
  }

  private async applyMirrors(ev: {
    network: string;
    contractId: string;
    topics: string[];
    payload: any;
  }) {
    try {
      const governanceId = process.env.GOVERNANCE_CONTRACT_ID;
      const stableId = process.env.STABLECOIN_CONTRACT_ID;
      // Eventos do contrato de governança: proposal_executed(target, method, value)
      if (governanceId && ev.contractId === governanceId) {
        const isExecuted = ev.topics.some((t) => /proposal_executed/i.test(t));
        if (isExecuted) {
          const target =
            ev.payload?.target ||
            ev.payload?.contractId ||
            ev.payload?.to ||
            null;
          const method = String(
            ev.payload?.method || ev.payload?.fn || ev.payload?.call || '',
          );
          const value =
            ev.payload?.value ?? ev.payload?.val ?? ev.payload?.arg ?? null;
          if (stableId && target === stableId) {
            await this.updateStablecoinMirror(stableId, method, value);
          }
        }
      }
    } catch (e) {
      this.logger.debug(`applyMirrors skipped: ${(e as Error).message}`);
    }
  }

  private async updateStablecoinMirror(
    contractId: string,
    method: string,
    value: any,
  ) {
    const scope = `stablecoin:${contractId}`;
    const keyMap: Record<string, string> = {
      set_paused: 'paused',
      set_mint_enabled: 'mint_enabled',
      set_burn_enabled: 'burn_enabled',
      set_risk_threshold: 'risk_threshold',
    };
    const k = keyMap[method];
    if (!k) return;

    // Normaliza booleanos/numéricos
    let v: any = value;
    if (typeof value === 'string') {
      if (/^(true|false)$/i.test(value)) v = /true/i.test(value);
      else if (/^\d+$/.test(value)) v = Number(value);
    }

    // Upsert no LedgerMirror
    await this.prisma.ledgerMirror.upsert({
      where: { scope_key: { scope, key: k } },
      create: { scope, key: k, value: v },
      update: { value: v, updatedAt: new Date() },
    } as any);

    // Atualiza cache Redis do painel da stablecoin
    const cacheKey = `dash:stablecoin:${contractId}`;
    const current = (await this.bus.get<Record<string, any>>(cacheKey)) || {};
    current[k] = v;
    await this.bus.set(cacheKey, current, 10);
  }
}
