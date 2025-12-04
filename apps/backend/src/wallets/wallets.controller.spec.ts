import { Test, TestingModule } from '@nestjs/testing';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';

describe('WalletsController', () => {
  let mod: TestingModule;
  let controller: WalletsController;

  const walletsStub = {
    list: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
  };

  beforeAll(async () => {
    mod = await Test.createTestingModule({
      controllers: [WalletsController],
      providers: [{ provide: WalletsService, useValue: walletsStub }],
    }).compile();

    controller = mod.get<WalletsController>(WalletsController);
  });

  afterAll(async () => {
    await mod.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('list', () => {
    it('should list wallets with query params', async () => {
      const mockWallets = [
        { id: '1', address: 'GC...', userId: 'user-1' },
        { id: '2', address: 'GB...', userId: 'user-1' },
      ];
      walletsStub.list.mockResolvedValue(mockWallets);

      const result = await controller.list({ userId: 'user-1' });

      expect(result.ok).toBe(true);
      expect(result.wallets).toEqual(mockWallets);
      expect(walletsStub.list).toHaveBeenCalledWith({ userId: 'user-1' });
    });

    it('should list all wallets when no query provided', async () => {
      const mockWallets = [{ id: '1', address: 'GC...', userId: 'user-1' }];
      walletsStub.list.mockResolvedValue(mockWallets);

      const result = await controller.list({});

      expect(result.ok).toBe(true);
      expect(result.wallets).toEqual(mockWallets);
      expect(walletsStub.list).toHaveBeenCalledWith({});
    });
  });

  describe('add', () => {
    it('should create a new wallet', async () => {
      const dto = { userId: 'user-1', label: 'My Wallet' };
      const mockCreated = {
        id: '1',
        address: 'GC...',
        userId: 'user-1',
        label: 'My Wallet',
      };
      walletsStub.create.mockResolvedValue(mockCreated);

      const result = await controller.add(dto);

      expect(result.ok).toBe(true);
      expect(result.wallet).toEqual(mockCreated);
      expect(walletsStub.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('remove', () => {
    it('should remove wallet by id', async () => {
      const mockRemoved = { id: '1', address: 'GC...', userId: 'user-1' };
      walletsStub.remove.mockResolvedValue(mockRemoved);

      const result = await controller.remove('1');

      expect(result.ok).toBe(true);
      expect(result.wallet).toEqual(mockRemoved);
      expect(walletsStub.remove).toHaveBeenCalledWith('1');
    });
  });
});
