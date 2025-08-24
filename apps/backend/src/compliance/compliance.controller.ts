import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ComplianceService } from './compliance.service';

@Controller('compliance')
export class ComplianceController {
  constructor(private readonly compliance: ComplianceService) {}

  @Post('kyc')
  async kyc(@Body() body: { document: string; name: string }) {
    if (!body?.document || !body.name) {
      throw new HttpException(
        'document e name são obrigatórios',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.compliance.kycCheck(body.document, body.name);
  }

  @Post('aml')
  async aml(@Body() body: { address: string }) {
    if (!body?.address) {
      throw new HttpException('address é obrigatório', HttpStatus.BAD_REQUEST);
    }
    return this.compliance.amlScreening(body.address);
  }

  @Post('route-check')
  async routeCheck(@Body() body: { userId: string }) {
    if (!body?.userId) {
      throw new HttpException('userId é obrigatório', HttpStatus.BAD_REQUEST);
    }
    return this.compliance.canRoutePixOrCard(body.userId);
  }
}
