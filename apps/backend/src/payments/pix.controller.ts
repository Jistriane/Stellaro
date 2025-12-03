import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  Request,
  UnauthorizedException,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PixService } from './pix.service';
import { JwtGuard } from '../auth/jwt.guard';
import { createHmac } from 'crypto';

class GeneratePixChargeDto {
  amountBRL: string;
  stellarAddress: string;
  cpf: string;
  name: string;
}

class PixWebhookDto {
  txId: string;
  status: 'confirmed' | 'failed';
  amount: number;
  paidAt?: string;
}

class InitPixWithdrawalDto {
  amountSTLT: string;
  pixKey: string;
  pixKeyType: 'cpf' | 'email' | 'phone' | 'random';
  stellarAddress: string;
}

@ApiTags('payments')
@Controller('payments/pix')
export class PixController {
  constructor(private readonly pixService: PixService) {}

  @Post('charge')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Gera cobrança PIX para mint de STLT' })
  async generateCharge(@Request() req, @Body() dto: GeneratePixChargeDto) {
    const result = await this.pixService.generatePixCharge({
      userId: req.user?.id || 'anonymous',
      ...dto,
    });
    if (!result.ok) {
      // Diferenciar erros de validação (400) de falhas de provider (200 com ok=false)
      if (result.error && (result.error.includes('Invalid CPF') || result.error.includes('Invalid amount'))) {
        throw new BadRequestException(result.error);
      }
      return result; // retorna 200 com { ok: false, error }
    }
    return result;
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Webhook para confirmação de pagamento PIX (provider only)' })
  async handleWebhook(
    @Headers('x-webhook-signature') signature: string,
    @Body() dto: PixWebhookDto,
  ) {
    // Validar assinatura HMAC
    const webhookSecret = process.env.PIX_WEBHOOK_SECRET || '';
    const payload = JSON.stringify(dto);
    const expectedSignature = createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    if (signature !== expectedSignature) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    return this.pixService.handlePixWebhook(dto);
  }

  @Post('withdrawal')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Inicia saque PIX (burn STLT → BRL)' })
  async initWithdrawal(@Request() req, @Body() dto: InitPixWithdrawalDto) {
    const result = await this.pixService.initPixWithdrawal({
      userId: req.user?.id || 'anonymous',
      ...dto,
    });
    if (!result.ok) {
      // Erros de validação devem ser 400
      if (result.error && (result.error.includes('Invalid amount') || result.error.includes('Invalid PIX key'))) {
        throw new BadRequestException(result.error);
      }
      return result; // provider/burn falha: 200 com ok=false
    }
    return result;
  }

  @Get('status/:txId')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Consulta status de pagamento PIX' })
  async getPaymentStatus(@Param('txId') txId: string) {
    return this.pixService.getPaymentStatus(txId);
  }
}
