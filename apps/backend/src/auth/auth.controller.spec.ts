import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let mod: TestingModule;
  let controller: AuthController;

  const authStub = {
    register: jest.fn(),
    login: jest.fn(),
    issueNonce: jest.fn(),
    verifyWalletSignature: jest.fn(),
    meFromToken: jest.fn(),
    updateMe: jest.fn(),
    passkeyRegisterInit: jest.fn(),
    passkeyRegisterVerify: jest.fn(),
    passkeyLoginInit: jest.fn(),
    passkeyLoginVerify: jest.fn(),
    emailInit: jest.fn(),
    emailVerify: jest.fn(),
  };

  const mockResponse = () => {
    const res: any = {};
    res.cookie = jest.fn().mockReturnValue(res);
    return res;
  };

  beforeAll(async () => {
    mod = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authStub }],
    }).compile();

    controller = mod.get<AuthController>(AuthController);
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

  describe('register', () => {
    it('should register a new user', async () => {
      const dto = { email: 'test@test.com', password: 'pass123' };
      const mockResult = { ok: true, userId: '1' };
      authStub.register.mockResolvedValue(mockResult);

      const result = await controller.register(dto);

      expect(result).toEqual(mockResult);
      expect(authStub.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('should login an existing user', async () => {
      const dto = { email: 'test@test.com', password: 'pass123' };
      const mockResult = { ok: true, token: 'jwt-token', userId: '1' };
      authStub.login.mockResolvedValue(mockResult);

      const result = await controller.login(dto);

      expect(result).toEqual(mockResult);
      expect(authStub.login).toHaveBeenCalledWith(dto);
    });
  });

  describe('nonce', () => {
    it('should issue nonce for wallet auth', async () => {
      const dto = { pubkey: 'GC...' };
      const mockResult = { nonce: 'random-nonce-123' };
      authStub.issueNonce.mockResolvedValue(mockResult);

      const result = await controller.nonce(dto);

      expect(result).toEqual(mockResult);
      expect(authStub.issueNonce).toHaveBeenCalledWith('GC...');
    });
  });

  describe('verify', () => {
    it('should verify wallet signature and set cookie', async () => {
      const dto = {
        pubkey: 'GC...',
        signature: 'sig123',
        message: 'msg',
        nonce: 'nonce-123',
      };
      const mockResult = {
        token: 'jwt-token',
        userId: 'user-1',
        pubkey: 'GC...',
      };
      authStub.verifyWalletSignature.mockResolvedValue(mockResult);

      const res = mockResponse();
      const result = await controller.verify(dto, res);

      expect(result).toEqual({
        ok: true,
        token: 'jwt-token',
        userId: 'user-1',
        pubkey: 'GC...',
      });
      expect(authStub.verifyWalletSignature).toHaveBeenCalledWith(dto);
      expect(res.cookie).toHaveBeenCalledWith(
        'token',
        'jwt-token',
        expect.any(Object),
      );
    });
  });

  describe('me', () => {
    it('should get user from cookie token', async () => {
      const mockUser = { id: '1', email: 'test@test.com' };
      authStub.meFromToken.mockResolvedValue({ user: mockUser });

      const req: any = { cookies: { token: 'jwt-token' } };
      const result = await controller.me(req);

      expect(result).toEqual({ authenticated: true, user: mockUser });
      expect(authStub.meFromToken).toHaveBeenCalledWith('jwt-token');
    });

    it('should get user from Authorization header', async () => {
      const mockUser = { id: '1', email: 'test@test.com' };
      authStub.meFromToken.mockResolvedValue({ user: mockUser });

      const req: any = {
        cookies: {},
        headers: { authorization: 'Bearer jwt-token-from-header' },
      };
      const result = await controller.me(req);

      expect(result).toEqual({ authenticated: true, user: mockUser });
      expect(authStub.meFromToken).toHaveBeenCalledWith(
        'jwt-token-from-header',
      );
    });

    it('should return unauthenticated payload when token is missing', async () => {
      const req: any = { cookies: {}, headers: {} };

      const result = await controller.me(req);

      expect(result).toEqual({ authenticated: false, user: null });
      expect(authStub.meFromToken).not.toHaveBeenCalled();
    });
  });

  describe('updateMe', () => {
    it('should update user profile', async () => {
      const mockUser = { id: '1', email: 'test@test.com', name: 'Updated' };
      authStub.updateMe.mockResolvedValue({ user: mockUser });

      const req: any = { cookies: { token: 'jwt-token' } };
      const body = { name: 'Updated' };
      const result = await controller.updateMe(req, body);

      expect(result).toEqual({ user: mockUser });
      expect(authStub.updateMe).toHaveBeenCalledWith('jwt-token', body);
    });
  });

  describe('passkey/register/init', () => {
    it('should initialize passkey registration', async () => {
      const mockChallenge = { challenge: 'abc123', options: {} };
      authStub.passkeyRegisterInit.mockResolvedValue(mockChallenge);

      const result = await controller.passkeyRegisterInit({
        email: 'test@test.com',
      });

      expect(result).toEqual(mockChallenge);
      expect(authStub.passkeyRegisterInit).toHaveBeenCalledWith(
        'test@test.com',
      );
    });
  });

  describe('passkey/login/verify', () => {
    it('should verify passkey login and set cookie', async () => {
      const mockResult = {
        token: 'jwt-token',
        userId: 'user-1',
        passkeyToken: 'pk-token',
      };
      authStub.passkeyLoginVerify.mockResolvedValue(mockResult);

      const res = mockResponse();
      const body = { challenge: 'ch123', assertion: {} };
      const result = await controller.passkeyLoginVerify(body, res);

      expect(result).toEqual({
        ok: true,
        userId: 'user-1',
        passkeyToken: 'pk-token',
      });
      expect(authStub.passkeyLoginVerify).toHaveBeenCalledWith(body);
      expect(res.cookie).toHaveBeenCalledWith(
        'token',
        'jwt-token',
        expect.any(Object),
      );
    });
  });

  describe('email/verify', () => {
    it('should verify email OTP and set cookie', async () => {
      const mockResult = { token: 'jwt-token', userId: 'user-1' };
      authStub.emailVerify.mockResolvedValue(mockResult);

      const res = mockResponse();
      const body = { email: 'test@test.com', code: '123456' };
      const result = await controller.emailVerify(body, res);

      expect(result).toEqual({
        ok: true,
        token: 'jwt-token',
        userId: 'user-1',
      });
      expect(authStub.emailVerify).toHaveBeenCalledWith(
        'test@test.com',
        '123456',
      );
      expect(res.cookie).toHaveBeenCalledWith(
        'token',
        'jwt-token',
        expect.any(Object),
      );
    });
  });
});
