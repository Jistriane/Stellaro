import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../auth/jwt.guard';
import { User } from '../auth/user.decorator';
import { SupportChatDto } from './dto/support-chat.dto';
import { SupportService } from './support.service';

type JwtUser = { id: string };

@ApiTags('support')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Cria ou continua thread de suporte assistivo' })
  async chat(@User() user: JwtUser, @Body() dto: SupportChatDto) {
    if (!dto.threadId) {
      const thread = await this.supportService.startThread({
        userId: user.id,
        subject: dto.subject,
        initialMessage: dto.message,
      });
      return { ok: true, thread };
    }

    const thread = await this.supportService.addUserMessage({
      userId: user.id,
      threadId: dto.threadId,
      messageText: dto.message,
    });
    return { ok: true, thread };
  }

  @Get('threads/:id')
  @ApiOperation({ summary: 'Consulta thread de suporte' })
  async getThread(@User() user: JwtUser, @Param('id') id: string) {
    const thread = await this.supportService.getThread(user.id, id);
    return { ok: true, thread };
  }

  @Get('threads')
  @ApiOperation({ summary: 'Lista threads de suporte do usuario autenticado' })
  async listThreads(
    @User() user: JwtUser,
    @Query('limit') limit?: string,
  ) {
    const take = limit ? Number(limit) : undefined;
    const threads = await this.supportService.listThreads(
      user.id,
      Number.isFinite(take) ? take : undefined,
    );
    return { ok: true, threads };
  }

  @Post('threads/:id/escalate')
  @ApiOperation({ summary: 'Escalona thread para atendimento humano' })
  async escalate(@User() user: JwtUser, @Param('id') id: string) {
    const thread = await this.supportService.escalateThread(user.id, id);
    return { ok: true, thread };
  }
}
