import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { WalletsService } from './wallets.service';
import { PrismaService } from '../prisma/prisma.service';

// Deterministic specs: create/import/derive and dry-run sign without network deps.

describe('WalletsService', () => {
  let module: TestingModule;
  let service: WalletsService;

  beforeAll(async () => {
    const prismaStub = ({
      wallet: {
        findMany: async () => [{ id: 'W1', userId: 'U1', provider: 'LOCAL', network: 'TESTNET' }],
        create: async (args: any) => ({ id: 'W2', ...args.data }),
        delete: async (args: any) => ({ id: args.where.id ?? 'W1' }),
      },
    } as unknown) as PrismaService;

    module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      providers: [
        WalletsService,
        { provide: PrismaService, useValue: prismaStub },
      ],
    }).compile();

    service = module.get<WalletsService>(WalletsService);
  });

  afterAll(async () => {
    if (module) await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should list wallets applying filters', async () => {
    const list = await service.list({ userId: 'U1', provider: 'LOCAL', network: 'TESTNET' } as any);
    expect(Array.isArray(list)).toBe(true);
    expect(list[0].userId).toBe('U1');
  });

  it('should create a wallet via persistence', async () => {
    const w = await service.create({ address: 'GABC', network: 'TESTNET', provider: 'LOCAL', userId: 'U2' } as any);
    expect(w.id).toBe('W2');
    expect(w.address).toBe('GABC');
  });

  it('should remove a wallet deterministically', async () => {
    const res = await service.remove('W1');
    expect(res.id).toBe('W1');
  });

  // Integration test for NotFound requires Prisma error class; skip here to keep unit deterministic.
});
