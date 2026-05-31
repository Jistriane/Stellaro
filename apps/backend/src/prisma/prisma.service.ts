import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly datasourceUrl = process.env.DATABASE_URL;

  constructor() {
    if (!process.env.DATABASE_URL && process.env.NODE_ENV !== 'test') {
      throw new Error('DATABASE_URL is required to initialize Prisma');
    }
    super(
      process.env.DATABASE_URL
        ? { adapter: new PrismaPg(process.env.DATABASE_URL) }
        : undefined,
    );
  }

  async onModuleInit() {
    if (process.env.NODE_ENV === 'test' && !this.datasourceUrl) return;
    await this.$connect();
  }
}
