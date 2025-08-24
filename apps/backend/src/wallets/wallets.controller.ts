import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { ListWalletsDto } from './dto/list-wallets.dto';

@Controller('wallets')
export class WalletsController {
  constructor(private readonly wallets: WalletsService) {}

  @Get()
  async list(@Query() query: ListWalletsDto) {
    const wallets = await this.wallets.list(query);
    return { ok: true, wallets };
  }

  @Post()
  async add(@Body() body: CreateWalletDto) {
    const created = await this.wallets.create(body);
    return { ok: true, wallet: created };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const removed = await this.wallets.remove(id);
    return { ok: true, wallet: removed };
  }
}
