import { MemoryController } from './memory.controller';
import { MemoryService } from './memory.service';

describe('MemoryController', () => {
  let controller: MemoryController;
  let service: jest.Mocked<MemoryService>;

  beforeEach(() => {
    service = {
      history: jest.fn(),
      logEvent: jest.fn(),
      recordProposal: jest.fn(),
      recordExecution: jest.fn(),
    } as unknown as jest.Mocked<MemoryService>;

    controller = new MemoryController(service);
  });

  it('returns user history', () => {
    const history = { userId: 'user-1', events: [{ type: 'TEST' }] };
    service.history.mockReturnValue(history as any);

    const result = controller.history('user-1');

    expect(service.history).toHaveBeenCalledWith('user-1');
    expect(result).toBe(history);
  });
});
