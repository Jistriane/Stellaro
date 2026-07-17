import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../auth/jwt.guard';
import { User } from '../auth/user.decorator';
import { PortfolioService } from './portfolio.service';

type JwtUser = { id: string };

@ApiTags('portfolio')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get('me')
  @ApiOperation({ summary: 'Retorna portfolio consolidado do usuario autenticado' })
  async me(@User() user: JwtUser) {
    const portfolio = await this.portfolioService.getPortfolioByUser(user.id);
    return { ok: true, portfolio };
  }
}
