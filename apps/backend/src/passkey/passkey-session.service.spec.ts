import { PasskeySessionService } from './passkey-session.service';

describe('PasskeySessionService', () => {
  const prisma = {
    passkey: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  } as any;

  beforeEach(() => jest.clearAllMocks());

  it('cria sessão válida após autenticação passkey', async () => {
    prisma.passkey.findUnique.mockResolvedValue({
      credentialId: 'cred1',
      userId: 'u1',
      signCount: 5,
    });
    prisma.passkey.update.mockResolvedValue({});

    const service = new PasskeySessionService(prisma);
    const session = await service.createSession('u1', 'cred1', {
      duration: 1800,
    });

    expect(session.userId).toBe('u1');
    expect(session.config.duration).toBe(1800);
    expect(prisma.passkey.update).toHaveBeenCalledWith({
      where: { credentialId: 'cred1' },
      data: { signCount: { increment: 1 } },
    });
  });

  it('rejeita sessão quando passkey não existe', async () => {
    prisma.passkey.findUnique.mockResolvedValue(null);
    const service = new PasskeySessionService(prisma);

    await expect(service.createSession('u1', 'invalid', {})).rejects.toThrow(
      'Invalid passkey',
    );
  });
});
