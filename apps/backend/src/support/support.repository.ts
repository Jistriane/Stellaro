import { Injectable } from '@nestjs/common';
import {
  Prisma,
  SupportMessage,
  SupportThread,
  SupportThreadStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SupportRepository {
  constructor(private readonly prisma: PrismaService) {}

  createThread(data: {
    userId: string;
    subject?: string;
    metadata?: Prisma.InputJsonValue;
  }): Promise<SupportThread> {
    return this.prisma.supportThread.create({
      data: {
        channel: 'elizaos',
        status: SupportThreadStatus.OPEN,
        ...data,
      },
    });
  }

  addMessage(data: {
    threadId: string;
    senderType: 'user' | 'assistant' | 'agent' | 'system';
    messageText: string;
    sources?: Prisma.InputJsonValue;
  }): Promise<SupportMessage> {
    return this.prisma.supportMessage.create({
      data: {
        sources: [],
        ...data,
      },
    });
  }

  findThreadWithMessages(threadId: string) {
    return this.prisma.supportThread.findUnique({
      where: { id: threadId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  listThreadsByUser(userId: string, take = 20) {
    return this.prisma.supportThread.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  updateStatus(id: string, status: SupportThreadStatus) {
    return this.prisma.supportThread.update({
      where: { id },
      data: { status },
    });
  }
}
