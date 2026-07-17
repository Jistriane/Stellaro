import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { SupportThreadStatus } from '@prisma/client';
import { ElizaService } from '../eliza/eliza.service';
import { PrismaService } from '../prisma/prisma.service';
import { SupportRepository } from './support.repository';

@Injectable()
export class SupportService {
  constructor(
    private readonly supportRepository: SupportRepository,
    private readonly prisma: PrismaService,
    private readonly eliza: ElizaService,
  ) {}

  async startThread(params: {
    userId: string;
    subject?: string;
    initialMessage: string;
    sources?: object[];
  }) {
    const thread = await this.supportRepository.createThread({
      userId: params.userId,
      subject: params.subject,
      metadata: { createdBy: 'elizaos' },
    });

    await this.supportRepository.addMessage({
      threadId: thread.id,
      senderType: 'user',
      messageText: params.initialMessage,
      sources: params.sources ?? [],
    });

    const context = await this.buildSupportContext(params.userId, thread.id);
    const assistant = await this.eliza.assistSupport({
      userId: params.userId,
      threadId: thread.id,
      message: params.initialMessage,
      subject: params.subject,
      statuses: context.statuses,
    });

    await this.supportRepository.addMessage({
      threadId: thread.id,
      senderType: 'assistant',
      messageText: assistant.reply,
      sources: assistant.sources,
    });

    return this.supportRepository.findThreadWithMessages(thread.id);
  }

  async addAssistantReply(params: {
    threadId: string;
    messageText: string;
    sources?: object[];
  }) {
    const thread = await this.supportRepository.findThreadWithMessages(
      params.threadId,
    );
    if (!thread) {
      throw new NotFoundException('Support thread not found');
    }

    await this.supportRepository.addMessage({
      threadId: params.threadId,
      senderType: 'assistant',
      messageText: params.messageText,
      sources: params.sources ?? [],
    });

    return this.supportRepository.findThreadWithMessages(params.threadId);
  }

  async addUserMessage(params: {
    userId: string;
    threadId: string;
    messageText: string;
    sources?: object[];
  }) {
    const thread = await this.supportRepository.findThreadWithMessages(
      params.threadId,
    );
    if (!thread) {
      throw new NotFoundException('Support thread not found');
    }
    if (thread.userId !== params.userId) {
      throw new ForbiddenException('Thread does not belong to authenticated user');
    }

    await this.supportRepository.addMessage({
      threadId: params.threadId,
      senderType: 'user',
      messageText: params.messageText,
      sources: params.sources ?? [],
    });

    const context = await this.buildSupportContext(params.userId, params.threadId);
    const assistant = await this.eliza.assistSupport({
      userId: params.userId,
      threadId: params.threadId,
      message: params.messageText,
      statuses: context.statuses,
    });

    await this.supportRepository.addMessage({
      threadId: params.threadId,
      senderType: 'assistant',
      messageText: assistant.reply,
      sources: assistant.sources,
    });

    return this.supportRepository.findThreadWithMessages(params.threadId);
  }

  async getThread(userId: string, threadId: string) {
    const thread = await this.supportRepository.findThreadWithMessages(threadId);
    if (!thread) {
      throw new NotFoundException('Support thread not found');
    }
    if (thread.userId !== userId) {
      throw new ForbiddenException('Thread does not belong to authenticated user');
    }
    return thread;
  }

  listThreads(userId: string, limit?: number) {
    return this.supportRepository.listThreadsByUser(userId, limit);
  }

  async escalateThread(userId: string, threadId: string) {
    await this.getThread(userId, threadId);
    return this.supportRepository.updateStatus(
      threadId,
      SupportThreadStatus.ESCALATED,
    );
  }

  private async buildSupportContext(userId: string, threadId?: string) {
    const [latestKyc, latestOrder, latestPixDeposit, latestPixWithdrawal] =
      await Promise.all([
        this.prisma.kycProfile.findFirst({
          where: { userId },
          orderBy: { updatedAt: 'desc' },
        }),
        this.prisma.exchangeOrder.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.pixPayment.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.pixWithdrawal.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

    return {
      threadId,
      statuses: {
        kycStatus: latestKyc?.status,
        latestOrderId: latestOrder?.id ?? null,
        latestOrderStatus: latestOrder?.status ?? null,
        latestPixDepositStatus: latestPixDeposit?.status ?? null,
        latestPixWithdrawalStatus: latestPixWithdrawal?.status ?? null,
      },
    };
  }
}
