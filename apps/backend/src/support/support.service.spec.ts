import { Test } from '@nestjs/testing';
import { ElizaService } from '../eliza/eliza.service';
import { PrismaService } from '../prisma/prisma.service';
import { SupportRepository } from './support.repository';
import { SupportService } from './support.service';

describe('SupportService', () => {
  let service: SupportService;
  let repository: jest.Mocked<SupportRepository>;
  let eliza: jest.Mocked<ElizaService>;
  let prisma: any;

  beforeEach(async () => {
    repository = {
      createThread: jest.fn(),
      addMessage: jest.fn(),
      findThreadWithMessages: jest.fn(),
      listThreadsByUser: jest.fn(),
      updateStatus: jest.fn(),
    } as unknown as jest.Mocked<SupportRepository>;

    eliza = {
      assistSupport: jest.fn(),
    } as unknown as jest.Mocked<ElizaService>;

    prisma = {
      kycProfile: { findFirst: jest.fn() },
      exchangeOrder: { findFirst: jest.fn() },
      pixPayment: { findFirst: jest.fn() },
      pixWithdrawal: { findFirst: jest.fn() },
    };

    const module = await Test.createTestingModule({
      providers: [
        SupportService,
        { provide: SupportRepository, useValue: repository },
        { provide: PrismaService, useValue: prisma },
        { provide: ElizaService, useValue: eliza },
      ],
    }).compile();

    service = module.get(SupportService);
  });

  it('abre thread e adiciona resposta assistiva do Eliza', async () => {
    repository.createThread.mockResolvedValue({ id: 'thread-1' } as any);
    repository.findThreadWithMessages.mockResolvedValue({
      id: 'thread-1',
      userId: 'user-1',
      messages: [],
    } as any);
    eliza.assistSupport.mockResolvedValue({
      reply: 'Seu saque esta em processamento.',
      sources: ['support_fallback_context'],
    });

    const result = await service.startThread({
      userId: 'user-1',
      subject: 'Saque PIX',
      initialMessage: 'Onde esta meu saque?',
    });

    expect(repository.addMessage).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        threadId: 'thread-1',
        senderType: 'user',
      }),
    );
    expect(repository.addMessage).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        threadId: 'thread-1',
        senderType: 'assistant',
        messageText: 'Seu saque esta em processamento.',
      }),
    );
    expect(result.id).toBe('thread-1');
  });

  it('adiciona mensagem do usuario e gera nova resposta do assistente', async () => {
    repository.findThreadWithMessages
      .mockResolvedValueOnce({
        id: 'thread-1',
        userId: 'user-1',
        messages: [],
      } as any)
      .mockResolvedValueOnce({
        id: 'thread-1',
        userId: 'user-1',
        messages: [{ messageText: 'ok' }],
      } as any);
    eliza.assistSupport.mockResolvedValue({
      reply: 'Seu KYC ainda esta pendente.',
      sources: ['support_fallback_context'],
    });

    const result = await service.addUserMessage({
      userId: 'user-1',
      threadId: 'thread-1',
      messageText: 'E meu KYC?',
    });

    expect(eliza.assistSupport).toHaveBeenCalled();
    expect(repository.addMessage).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ senderType: 'user' }),
    );
    expect(repository.addMessage).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ senderType: 'assistant' }),
    );
    expect(result.id).toBe('thread-1');
  });

  it('lista threads do usuario', async () => {
    repository.listThreadsByUser.mockResolvedValue([
      { id: 'thread-1', userId: 'user-1' },
    ] as any);

    const result = await service.listThreads('user-1', 10);

    expect(repository.listThreadsByUser).toHaveBeenCalledWith('user-1', 10);
    expect(result).toHaveLength(1);
  });
});
