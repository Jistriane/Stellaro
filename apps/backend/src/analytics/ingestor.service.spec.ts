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
