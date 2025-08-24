import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { ListWalletsDto } from './dto/list-wallets.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class WalletsService {
  constructor(private readonly prisma: PrismaService) {}

  list(query?: ListWalletsDto) {
    const whereRaw: Record<string, unknown> = {};
    if (query?.userId) whereRaw.userId = query.userId;
    if (query?.provider) whereRaw.provider = query.provider;
    if (query?.network) whereRaw.network = query.network;
    const where = whereRaw as Prisma.WalletWhereInput;

    return this.prisma.wallet.findMany({
      where: where,
      orderBy: { createdAt: 'desc' },
      skip: query?.skip ?? 0,
      take: query?.take ?? 20,
    });
  }

  async create(data: CreateWalletDto) {
    // basic uniqueness is enforced by Prisma on address
    return this.prisma.wallet.create({ data });
  }

  async remove(id: string) {
    try {
      return await this.prisma.wallet.delete({ where: { id } });
    } catch (e: unknown) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      )
        throw new NotFoundException('Wallet not found');
      throw e;
    }
  }
}
