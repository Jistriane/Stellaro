import { HistoryController } from './history.controller';
import { HorizonService } from '../chain/horizon.service';

describe('HistoryController', () => {
  let controller: HistoryController;
  let horizon: jest.Mocked<HorizonService>;

  beforeEach(() => {
    horizon = {
      listOperations: jest.fn(),
    } as unknown as jest.Mocked<HorizonService>;

    controller = new HistoryController(horizon);
  });

  it('maps horizon operations into history items and extracts next cursor', async () => {
    horizon.listOperations.mockResolvedValue({
      _embedded: {
        records: [
          {
            id: '1',
            type: 'payment',
            created_at: '2023-01-01',
            source_account: 'GABC',
            transaction_hash: 'tx1',
          },
        ],
      },
      _links: {
        next: { href: 'http://example.test?cursor=abc123' },
      },
    } as any);

    const result = await controller.listHistory('addr-1', undefined, 10);

    expect(horizon.listOperations).toHaveBeenCalledWith(
      'addr-1',
      undefined,
      10,
    );
    expect(result).toEqual({
      address: 'addr-1',
      cursor: 'abc123',
      items: [
        {
          id: '1',
          type: 'payment',
          created_at: '2023-01-01',
          source_account: 'GABC',
          transaction_hash: 'tx1',
          details: {
            id: '1',
            type: 'payment',
            created_at: '2023-01-01',
            source_account: 'GABC',
            transaction_hash: 'tx1',
          },
        },
      ],
    });
  });

  it('returns empty items when horizon records are missing', async () => {
    horizon.listOperations.mockResolvedValue({ _links: {} } as any);

    const result = await controller.listHistory('addr-2');

    expect(horizon.listOperations).toHaveBeenCalledWith(
      'addr-2',
      undefined,
      20,
    );
    expect(result).toEqual({ address: 'addr-2', cursor: undefined, items: [] });
  });
});
