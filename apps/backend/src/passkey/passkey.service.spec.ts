import { Test, TestingModule } from '@nestjs/testing';
import { PasskeyService } from './passkey.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

// Testes leves para cobrir construção, inicialização e caminhos sem kit instalado
describe('PasskeyService', () => {
  let service: PasskeyService;
  let prisma: PrismaService;
  let redis: RedisService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasskeyService,
        {
          provide: PrismaService,
          useValue: {
            passkey: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
            },
            user: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PasskeyService>(PasskeyService);
    prisma = module.get<PrismaService>(PrismaService);
    redis = module.get<RedisService>(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initRegistration', () => {
    it('should generate challenge and cache user info', async () => {
      (redis.set as jest.Mock).mockResolvedValue('OK');

      const res = await service.initRegistration('user-1', 'user@test.com');

      expect(res.challenge).toBeDefined();
      expect(res.rpId).toBe('localhost');
      expect(res.user.id).toBe('user-1');
      expect(res.user.name).toBe('user@test.com');
      expect(redis.set).toHaveBeenCalledWith(
        expect.stringContaining('pk:reg:'),
        { userId: 'user-1', email: 'user@test.com' },
        300,
      );
    });
  });

  describe('verifyRegistration', () => {
    it('should return error when challenge expired', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);

      const res = await service.verifyRegistration({
        challenge: 'expired',
        credential: {},
      });

      expect(res.ok).toBe(false);
      expect(res.error).toBe('registration_challenge_expired');
    });

    it('should handle missing credential gracefully', async () => {
      (redis.get as jest.Mock).mockResolvedValue({
        userId: 'user-1',
        email: 'test@test.com',
      });

      const res = await service.verifyRegistration({ challenge: 'valid' });

      // Sem kit instalado, retorna erro ou validação mínima
      expect(res).toBeDefined();
      expect(typeof res.ok).toBe('boolean');
    });
  });

  describe('initLogin', () => {
    it('should return error for non-existent user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await service.initLogin('missing@test.com');

      expect(res.ok).toBe(false);
      expect(res.error).toBe('user_not_found');
    });

    it('should generate login challenge for existing user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
      });
      (redis.set as jest.Mock).mockResolvedValue('OK');

      const res = await service.initLogin('test@test.com');

      expect(res.ok).toBe(true);
      expect(res.challenge).toBeDefined();
      expect(redis.set).toHaveBeenCalledWith(
        expect.stringContaining('pk:auth:'),
        expect.objectContaining({ userId: 'user-1' }),
        300,
      );
    });
  });

  describe('verifyLogin', () => {
    it('should return error when challenge expired', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);

      const res = await service.verifyLogin({
        challenge: 'missing',
        assertion: {},
      });

      expect(res.ok).toBe(false);
      expect(res.error).toBe('auth_challenge_expired');
    });
  });

  it('should initialize without crashing when passkey-kit not installed', () => {
    // getKit é privado; apenas verificamos que o serviço foi criado com sucesso
    expect(service).toBeDefined();
    expect(typeof service.initRegistration).toBe('function');
  });
});
