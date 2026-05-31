import { Controller, Get, Param, Query } from '@nestjs/common';
import { HorizonService } from '../chain/horizon.service';

@Controller('memory')
export class HistoryController {
  constructor(private readonly horizon: HorizonService) {}

  @Get('history/:address')
  async listHistory(
    @Param('address') address: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit = 20,
  ): Promise<{ address: string; cursor?: string; items: any[] }> {
    const ops = await this.horizon.listOperations(
      address,
      cursor,
      Number(limit),
    );
    const records = Array.isArray(ops?._embedded?.records)
      ? ops._embedded.records
      : [];
    const items = records.map((r: any) => ({
      id: r.id,
      type: r.type,
      created_at: r.created_at,
      source_account: r.source_account,
      transaction_hash: r.transaction_hash,
      details: r,
    }));
    const nextCursor = ops?._links?.next?.href
      ? (new URL(ops._links.next.href).searchParams.get('cursor') ?? undefined)
      : undefined;
    return { address, cursor: nextCursor, items };
  }
}
