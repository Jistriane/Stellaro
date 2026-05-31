import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { PasskeyService } from '../passkey/passkey.service';
import * as StellarSdk from '@stellar/stellar-sdk';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let passkeyService: PasskeyService;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
              upsert: jest.fn(),
              update: jest.fn(),
            },
            wallet: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: PasskeyService,
          useValue: {
            initRegistration: jest.fn(),
            verifyRegistration: jest.fn(),
            initLogin: jest.fn(),
            verifyLogin: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    passkeyService = module.get<PasskeyService>(PasskeyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should create new user and init passkey registration', async () => {
      const registerDto = { email: 'newuser@example.com', name: 'New User' };
      const passkeyOptions = { challenge: 'abc123', rpId: 'stellaro.io' };

      jest.spyOn(prisma.user, 'upsert').mockResolvedValue(mockUser);
      jest
        .spyOn(passkeyService, 'initRegistration')
        .mockResolvedValue(passkeyOptions);

      const result = await service.register(registerDto);

      expect(result.user).toEqual(mockUser);
      expect(result.passkeyOptions).toEqual(passkeyOptions);
      expect(prisma.user.upsert).toHaveBeenCalledWith({
        where: { email: registerDto.email },
        create: { email: registerDto.email, name: registerDto.name },
        update: { name: registerDto.name },
      });
      expect(passkeyService.initRegistration).toHaveBeenCalledWith(
        mockUser.id,
        mockUser.email,
      );
    });

    it('should update existing user', async () => {
      const registerDto = {
        email: 'existing@example.com',
        name: 'Updated Name',
      };

      jest
        .spyOn(prisma.user, 'upsert')
        .mockResolvedValue({ ...mockUser, name: 'Updated Name' });
      jest.spyOn(passkeyService, 'initRegistration').mockResolvedValue({});

      const result = await service.register(registerDto);

      expect(result.user.name).toBe('Updated Name');
    });
  });

  describe('login', () => {
    it('should authenticate user and return token', async () => {
      const loginDto = { email: 'test@example.com' };
      const token = 'jwt-token-123';

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue(token);

      const result = await service.login(loginDto);

      expect(result.user).toEqual(mockUser);
      expect(result.token).toBe(token);
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
    });

    it('should throw NotFoundException for non-existent user', async () => {
      const loginDto = { email: 'nonexistent@example.com' };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('webauthnAttestation', () => {
    it('should verify registration and store credential', async () => {
      const payload = { challenge: 'abc123', credential: {} };

      jest
        .spyOn(passkeyService, 'verifyRegistration')
        .mockResolvedValue({ ok: true });

      const result = await service.webauthnAttestation(payload);

      expect(result.ok).toBe(true);
      expect(passkeyService.verifyRegistration).toHaveBeenCalledWith(payload);
    });

    it('should throw UnauthorizedException on verification failure', async () => {
      const payload = { challenge: 'abc123', credential: {} };

      jest.spyOn(passkeyService, 'verifyRegistration').mockResolvedValue({
        ok: false,
        error: 'Invalid credential',
      });

      await expect(service.webauthnAttestation(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('webauthnAssertion', () => {
    it('should verify login and return tokens', async () => {
      const payload = { challenge: 'abc123', assertion: {} };
      const appToken = 'app-token-123';
      const passkeyToken = 'passkey-token-123';

      jest.spyOn(passkeyService, 'verifyLogin').mockResolvedValue({
        ok: true,
        userId: mockUser.id,
        token: passkeyToken,
      });
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue(appToken);

      const result = await service.webauthnAssertion(payload);

      expect(result.ok).toBe(true);
      expect(result.token).toBe(appToken);
      expect(result.passkeyToken).toBe(passkeyToken);
      expect(result.user).toEqual(mockUser);
    });

    it('should throw UnauthorizedException on login failure', async () => {
      const payload = { challenge: 'abc123', assertion: {} };

      jest.spyOn(passkeyService, 'verifyLogin').mockResolvedValue({
        ok: false,
        error: 'Invalid assertion',
      });

      await expect(service.webauthnAssertion(payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw NotFoundException if user not found after login', async () => {
      const payload = { challenge: 'abc123', assertion: {} };

      jest.spyOn(passkeyService, 'verifyLogin').mockResolvedValue({
        ok: true,
        userId: 'unknown-user',
        token: 'token',
      });
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(service.webauthnAssertion(payload)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('issueNonce', () => {
    it('should issue nonce JWT for wallet auth', async () => {
      const pubkey = 'GTEST123456';
      const nonce = 'nonce-jwt-123';

      jest.spyOn(jwtService, 'signAsync').mockResolvedValue(nonce);

      const result = await service.issueNonce(pubkey);

      expect(result.nonce).toBe(nonce);
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: pubkey, kind: 'wallet_nonce' },
        expect.objectContaining({ expiresIn: '5m' }),
      );
    });

    it('should throw UnauthorizedException for missing pubkey', async () => {
      await expect(service.issueNonce('')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('verifyWalletSignature', () => {
    const validPubkey = StellarSdk.Keypair.random().publicKey();
    const validNonce = 'valid-nonce-jwt';
    const validSignature = Buffer.alloc(64).toString('base64'); // Mock signature

    beforeEach(() => {
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({
        sub: validPubkey,
        kind: 'wallet_nonce',
      });
    });

    it('should verify valid wallet signature and create user', async () => {
      const token = 'auth-token-123';

      jest.spyOn(prisma.wallet, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.user, 'create').mockResolvedValue(mockUser);
      jest.spyOn(prisma.wallet, 'create').mockResolvedValue({
        id: 'wallet-1',
        userId: mockUser.id,
        address: validPubkey,
        provider: 'freighter',
        network: 'testnet',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue(token);

      // Mock nacl verification
      const nacl = require('tweetnacl');
      jest.spyOn(nacl.sign.detached, 'verify').mockReturnValue(true);

      const result = await service.verifyWalletSignature({
        pubkey: validPubkey,
        nonce: validNonce,
        signature: validSignature,
      });

      expect(result.token).toBe(token);
      expect(result.userId).toBe(mockUser.id);
      expect(result.pubkey).toBe(validPubkey);
    });

    it('should authenticate existing wallet user', async () => {
      const existingWallet = {
        id: 'wallet-1',
        userId: mockUser.id,
        address: validPubkey,
        provider: 'freighter',
        network: 'testnet',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(prisma.wallet, 'findUnique').mockResolvedValue(existingWallet);
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue('token');

      const nacl = require('tweetnacl');
      jest.spyOn(nacl.sign.detached, 'verify').mockReturnValue(true);

      const result = await service.verifyWalletSignature({
        pubkey: validPubkey,
        nonce: validNonce,
        signature: validSignature,
      });

      expect(result.userId).toBe(mockUser.id);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid nonce', async () => {
      jest
        .spyOn(jwtService, 'verifyAsync')
        .mockRejectedValue(new Error('Invalid token'));

      await expect(
        service.verifyWalletSignature({
          pubkey: validPubkey,
          nonce: 'invalid-nonce',
          signature: validSignature,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for mismatched pubkey', async () => {
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue({
        sub: 'GDIFFERENTPUBKEY',
        kind: 'wallet_nonce',
      });

      await expect(
        service.verifyWalletSignature({
          pubkey: validPubkey,
          nonce: validNonce,
          signature: validSignature,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid signature', async () => {
      const nacl = require('tweetnacl');
      jest.spyOn(nacl.sign.detached, 'verify').mockReturnValue(false);

      await expect(
        service.verifyWalletSignature({
          pubkey: validPubkey,
          nonce: validNonce,
          signature: validSignature,
        }),
      ).rejects.toThrow('Invalid signature');
    });

    it('should handle hex signature format', async () => {
      const hexSignature = Buffer.alloc(64).toString('hex');

      jest.spyOn(jwtService, 'signAsync').mockResolvedValue('token');
      jest.spyOn(prisma.wallet, 'findUnique').mockResolvedValue({
        id: 'wallet-1',
        userId: mockUser.id,
        address: validPubkey,
        provider: 'freighter',
        network: 'testnet',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const nacl = require('tweetnacl');
      jest.spyOn(nacl.sign.detached, 'verify').mockReturnValue(true);

      const result = await service.verifyWalletSignature({
        pubkey: validPubkey,
        nonce: validNonce,
        signature: hexSignature,
      });

      expect(result.token).toBeTruthy();
    });
  });

  describe('meFromToken', () => {
    it('should return user from valid token', async () => {
      const token = 'valid-token-123';

      jest
        .spyOn(jwtService, 'verifyAsync')
        .mockResolvedValue({ sub: mockUser.id });
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

      const result = await service.meFromToken(token);

      expect(result.user).toEqual(mockUser);
    });

    it('should throw UnauthorizedException for missing token', async () => {
      await expect(service.meFromToken()).rejects.toThrow('Missing token');
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      jest
        .spyOn(jwtService, 'verifyAsync')
        .mockRejectedValue(new Error('Invalid'));

      await expect(service.meFromToken('invalid-token')).rejects.toThrow(
        'Invalid token',
      );
    });

    it('should throw NotFoundException for non-existent user', async () => {
      jest
        .spyOn(jwtService, 'verifyAsync')
        .mockResolvedValue({ sub: 'unknown-user' });
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(service.meFromToken('token')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateMe', () => {
    it('should update user profile', async () => {
      const token = 'valid-token';
      const updatedUser = { ...mockUser, name: 'Updated Name' };

      jest
        .spyOn(jwtService, 'verifyAsync')
        .mockResolvedValue({ sub: mockUser.id });
      jest.spyOn(prisma.user, 'update').mockResolvedValue(updatedUser);

      const result = await service.updateMe(token, { name: 'Updated Name' });

      expect(result.user.name).toBe('Updated Name');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { name: 'Updated Name' },
      });
    });

    it('should handle null name', async () => {
      const token = 'valid-token';

      jest
        .spyOn(jwtService, 'verifyAsync')
        .mockResolvedValue({ sub: mockUser.id });
      jest
        .spyOn(prisma.user, 'update')
        .mockResolvedValue({ ...mockUser, name: null });

      const result = await service.updateMe(token, { name: null });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { name: null },
      });
    });

    it('should throw UnauthorizedException for missing token', async () => {
      await expect(
        service.updateMe(undefined, { name: 'Test' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('passkey methods', () => {
    describe('passkeyRegisterInit', () => {
      it('should init passkey registration for new user', async () => {
        const options = { challenge: 'abc123', rpId: 'stellaro.io' };

        jest.spyOn(prisma.user, 'upsert').mockResolvedValue(mockUser);
        jest
          .spyOn(passkeyService, 'initRegistration')
          .mockResolvedValue(options);

        const result = await service.passkeyRegisterInit('test@example.com');

        expect(result).toEqual(options);
        expect(prisma.user.upsert).toHaveBeenCalled();
      });

      it('should throw for missing email', async () => {
        await expect(service.passkeyRegisterInit('')).rejects.toThrow(
          UnauthorizedException,
        );
      });
    });

    describe('passkeyRegisterVerify', () => {
      it('should verify passkey registration', async () => {
        const payload = { challenge: 'abc123', credential: {} };

        jest
          .spyOn(passkeyService, 'verifyRegistration')
          .mockResolvedValue({ ok: true });

        const result = await service.passkeyRegisterVerify(payload);

        expect(result.ok).toBe(true);
      });

      it('should throw on verification failure', async () => {
        const payload = { challenge: 'abc123', credential: {} };

        jest.spyOn(passkeyService, 'verifyRegistration').mockResolvedValue({
          ok: false,
          error: 'Invalid credential',
        });

        await expect(service.passkeyRegisterVerify(payload)).rejects.toThrow(
          UnauthorizedException,
        );
      });
    });

    describe('passkeyLoginInit', () => {
      it('should init passkey login', async () => {
        const result = {
          ok: true,
          challenge: 'abc123',
          allowCredentials: [],
        };

        jest.spyOn(passkeyService, 'initLogin').mockResolvedValue(result);

        const response = await service.passkeyLoginInit('test@example.com');

        expect(response.ok).toBe(true);
        expect(response.challenge).toBe('abc123');
      });

      it('should throw NotFoundException for non-existent user', async () => {
        jest.spyOn(passkeyService, 'initLogin').mockResolvedValue({
          ok: false,
          error: 'User not found',
        });

        await expect(
          service.passkeyLoginInit('unknown@example.com'),
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('passkeyLoginVerify', () => {
      it('should verify passkey login and return tokens', async () => {
        const payload = { challenge: 'abc123', assertion: {} };
        const appToken = 'app-token';
        const passkeyToken = 'passkey-token';

        jest.spyOn(passkeyService, 'verifyLogin').mockResolvedValue({
          ok: true,
          userId: mockUser.id,
          token: passkeyToken,
        });
        jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
        jest.spyOn(jwtService, 'signAsync').mockResolvedValue(appToken);

        const result = await service.passkeyLoginVerify(payload);

        expect(result.ok).toBe(true);
        expect(result.token).toBe(appToken);
        expect(result.passkeyToken).toBe(passkeyToken);
        expect(result.userId).toBe(mockUser.id);
      });
    });
  });

  describe('email OTP (dev)', () => {
    describe('emailInit', () => {
      it('should generate and store OTP code', () => {
        const result = service.emailInit('test@example.com');

        expect(result.ok).toBe(true);
        expect(result.code).toMatch(/^\d{6}$/);
      });

      it('should throw for missing email', () => {
        expect(() => service.emailInit('')).toThrow(UnauthorizedException);
      });
    });

    describe('emailVerify', () => {
      it('should verify valid OTP and return token', async () => {
        const email = 'test@example.com';
        const initResult = service.emailInit(email);
        const token = 'email-token-123';

        jest.spyOn(prisma.user, 'upsert').mockResolvedValue(mockUser);
        jest.spyOn(jwtService, 'signAsync').mockResolvedValue(token);

        const result = await service.emailVerify(email, initResult.code);

        expect(result.ok).toBe(true);
        expect(result.token).toBe(token);
        expect(result.userId).toBe(mockUser.id);
      });

      it('should throw for invalid OTP code', async () => {
        const email = 'test@example.com';
        service.emailInit(email);

        await expect(service.emailVerify(email, '000000')).rejects.toThrow(
          'Invalid code',
        );
      });

      it('should throw for non-existent email', async () => {
        await expect(
          service.emailVerify('unknown@example.com', '123456'),
        ).rejects.toThrow('Invalid code');
      });
    });
  });
});
