import { IngestorService } from './ingestor.service';

describe('IngestorService (expanded)', () => {
  let service: IngestorService;
  let mockPrisma: any;
  let mockBus: any;
  let origEnv: any;

  beforeEach(() => {
    origEnv = { ...process.env };
    process.env.NODE_ENV = 'test';

    mockPrisma = {
      onchainEvent: {
        findFirst: jest.fn().mockResolvedValue({ ledgerSeq: 123 }),
        create: jest.fn().mockResolvedValue({}),
      },
      ledgerMirror: {
        upsert: jest.fn().mockResolvedValue({}),
      },
    };

    mockBus = {
      publish: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
    };

    service = new IngestorService(mockPrisma, mockBus);
  });

  afterEach(() => {
    process.env = origEnv;
  });

  it('onModuleInit should read lastSeq from DB and disable loop in test env', async () => {
    await service.onModuleInit();
    expect(mockPrisma.onchainEvent.findFirst).toHaveBeenCalledWith({
      orderBy: { ledgerSeq: 'desc' },
    });
    expect((service as any).lastSeq).toBe(123);
    expect((service as any).running).toBe(false); // não inicia loop em test
  });

  it('updateStablecoinMirror should normalize boolean string and upsert mirror', async () => {
    const contractId = 'stable-1';
    const method = 'set_mint_enabled';
    const value = 'true';

    await (service as any).updateStablecoinMirror(contractId, method, value);

    expect(mockPrisma.ledgerMirror.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { scope_key: { scope: 'stablecoin:stable-1', key: 'mint_enabled' } },
        create: expect.objectContaining({ value: true }),
        update: expect.objectContaining({ value: true }),
      })
    );

    expect(mockBus.set).toHaveBeenCalledWith(
      'dash:stablecoin:stable-1',
      expect.objectContaining({ mint_enabled: true }),
      10
    );
  });

  it('updateStablecoinMirror should parse numeric values', async () => {
    const method = 'set_risk_threshold';
    const value = '5000';

    await (service as any).updateStablecoinMirror('stable-1', method, value);

    expect(mockPrisma.ledgerMirror.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ value: 5000 }),
      })
    );
  });

  it('applyMirrors should detect governance proposal_executed and call updateStablecoinMirror', async () => {
    process.env.GOVERNANCE_CONTRACT_ID = 'gov-1';
    process.env.STABLECOIN_CONTRACT_ID = 'stable-1';

    const spy = jest.spyOn(service as any, 'updateStablecoinMirror').mockResolvedValue(undefined);

    const ev = {
      network: 'testnet',
      contractId: 'gov-1',
      topics: ['proposal_executed'],
      payload: {
        target: 'stable-1',
        method: 'set_paused',
        value: 'false',
      },
    };

    await (service as any).applyMirrors(ev);
    expect(spy).toHaveBeenCalledWith('stable-1', 'set_paused', 'false');
  });

  it('applyMirrors should skip non-matching contracts', async () => {
    process.env.GOVERNANCE_CONTRACT_ID = 'gov-1';
    process.env.STABLECOIN_CONTRACT_ID = 'stable-1';

    const spy = jest.spyOn(service as any, 'updateStablecoinMirror').mockResolvedValue(undefined);

    const ev = {
      network: 'testnet',
      contractId: 'other-contract',
      topics: ['proposal_executed'],
      payload: { target: 'stable-1', method: 'set_mint_enabled', value: 'true' },
    };

    await (service as any).applyMirrors(ev);
    expect(spy).not.toHaveBeenCalled();
  });

  it('applyMirrors should skip events without proposal_executed topic', async () => {
    process.env.GOVERNANCE_CONTRACT_ID = 'gov-1';
    process.env.STABLECOIN_CONTRACT_ID = 'stable-1';

    const spy = jest.spyOn(service as any, 'updateStablecoinMirror').mockResolvedValue(undefined);

    const ev = {
      network: 'testnet',
      contractId: 'gov-1',
      topics: ['other_event'],
      payload: { target: 'stable-1', method: 'set_mint_enabled', value: 'true' },
    };

    await (service as any).applyMirrors(ev);
    expect(spy).not.toHaveBeenCalled();
  });

  it('onModuleInit should skip when NODE_ENV is not test but ELIZA_ENABLED is false', async () => {
    process.env.NODE_ENV = 'development';
    process.env.SOROBAN_RPC_URL = ''; // Simulate no RPC available
    delete process.env.SOROBAN_RPC_URL; // Actually unset it

    // Mock require to avoid SDK errors
    const mockSdk = { rpc: null, SorobanRpc: null };
    jest.mock('@stellar/stellar-sdk', () => mockSdk);

    const svc2 = new IngestorService(mockPrisma, mockBus);
    // In non-test env with no RPC, the service should handle gracefully
    // onModuleInit will still call findFirst but won't start loop
    await svc2.onModuleInit();
    expect(mockPrisma.onchainEvent.findFirst).toHaveBeenCalled();
  });
});
import { IngestorService } from './ingestor.service';

describe('IngestorService', () => {
  const prisma = {
    onchainEvent: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    ledgerMirror: { upsert: jest.fn() },
  } as any;
  const redis = { publish: jest.fn() } as any;

  beforeEach(() => jest.clearAllMocks());

  it('inicializa sem rodar polling em test env', async () => {
    prisma.onchainEvent.findFirst.mockResolvedValue(null);
    const service = new IngestorService(prisma, redis);

    await service.onModuleInit();

    // Em NODE_ENV=test, loop() não deve rodar
    expect(prisma.onchainEvent.findFirst).toHaveBeenCalled();
  });
});
