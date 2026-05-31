import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Req,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ComplianceService } from './compliance.service';
import { RedisService } from '../redis/redis.service';
import { AuthService } from '../auth/auth.service';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import type { Request } from 'express';

type KycSubmissionBody = {
  userId?: string;
  name: string;
  email?: string;
  phone?: string;
  dob?: string;
  publicKey?: string;
  document: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  revenue?: string;
};

type KycFiles = {
  idDocument?: Array<{
    originalname: string;
    mimetype: string;
    size: number;
    path: string;
  }>;
  selfie?: Array<{
    originalname: string;
    mimetype: string;
    size: number;
    path: string;
  }>;
  addressProof?: Array<{
    originalname: string;
    mimetype: string;
    size: number;
    path: string;
  }>;
  revenueProof?: Array<{
    originalname: string;
    mimetype: string;
    size: number;
    path: string;
  }>;
};

type MulterFileLike = {
  originalname: string;
};

const createDiskStorage = diskStorage as unknown as (
  options: unknown,
) => unknown;

@Controller('compliance')
export class ComplianceController {
  constructor(
    private readonly compliance: ComplianceService,
    private readonly redis: RedisService,
    private readonly auth: AuthService,
  ) {}

  private extractToken(req: Request): string | null {
    const cookies = req.cookies as Record<string, string> | undefined;
    const cookieToken = cookies?.token;
    if (cookieToken) return cookieToken;

    const auth = req.headers?.authorization;
    if (auth?.toLowerCase().startsWith('bearer ')) {
      return auth.substring(7).trim();
    }
    return null;
  }

  private async resolveUserId(
    req: Request,
    explicitUserId?: string,
  ): Promise<string | null> {
    if (explicitUserId) return explicitUserId;
    const token = this.extractToken(req);
    if (!token) return null;
    const session = await this.redis.get<{ userId: string }>(`sess:${token}`);
    if (session?.userId) return session.userId;
    try {
      const { user } = await this.auth.meFromToken(token);
      return user.id;
    } catch {
      return null;
    }
  }

  @Get('kyc/me')
  async getMyLatestKyc(@Req() req: Request) {
    const userId = await this.resolveUserId(req);
    if (!userId) {
      return {
        authenticated: false,
        hasSubmission: false,
        status: 'Not started',
        progressPct: 0,
        nextStep: 'Sign in to submit KYC application',
        documents: [],
      };
    }
    return this.compliance.getLatestKycForUser(userId);
  }

  @Get('kyc/history/me')
  async getMyKycHistory(@Req() req: Request) {
    const userId = await this.resolveUserId(req);
    if (!userId) {
      return { authenticated: false, items: [] };
    }
    return this.compliance.getKycHistoryForUser(userId);
  }

  @Get('limits')
  async getLimits(@Query('userId') userId: string) {
    if (!userId) {
      throw new HttpException('userId é obrigatório', HttpStatus.BAD_REQUEST);
    }
    return this.compliance.getLimits(userId);
  }

  @Post('kyc')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'idDocument', maxCount: 1 },
        { name: 'selfie', maxCount: 1 },
        { name: 'addressProof', maxCount: 1 },
        { name: 'revenueProof', maxCount: 1 },
      ],
      {
        storage: createDiskStorage({
          destination: (
            _req: Request,
            _file: MulterFileLike,
            cb: (error: Error | null, destination: string) => void,
          ) => {
            const uploadDir = path.resolve(process.cwd(), 'uploads', 'kyc');
            fs.mkdirSync(uploadDir, { recursive: true });
            cb(null, uploadDir);
          },
          filename: (
            _req: Request,
            file: MulterFileLike,
            cb: (error: Error | null, filename: string) => void,
          ) => {
            const ext = path.extname(file.originalname) || '';
            const safeBase = path
              .basename(file.originalname, ext)
              .replace(/[^a-zA-Z0-9_-]/g, '_')
              .slice(0, 40);
            cb(null, `${Date.now()}-${safeBase}${ext}`);
          },
        }),
        limits: { fileSize: 8 * 1024 * 1024 },
      },
    ),
  )
  async kyc(
    @Req() req: Request,
    @Body() body: KycSubmissionBody,
    @UploadedFiles() files: KycFiles,
  ) {
    const resolvedUserId = await this.resolveUserId(req, body.userId);
    const bodyWithUser = { ...body, userId: resolvedUserId ?? body.userId };

    if (!body?.document || !body.name) {
      throw new HttpException(
        'document e name são obrigatórios',
        HttpStatus.BAD_REQUEST,
      );
    }

    const hasExtendedPayload =
      Boolean(
        body.addressLine1 ||
        body.revenue ||
        body.email ||
        body.phone ||
        body.publicKey,
      ) ||
      Boolean(
        files?.idDocument?.length ||
        files?.selfie?.length ||
        files?.addressProof?.length ||
        files?.revenueProof?.length,
      );

    if (!hasExtendedPayload) {
      return this.compliance.kycCheck(bodyWithUser.document, bodyWithUser.name);
    }

    if (!bodyWithUser.userId) {
      throw new HttpException(
        'usuario nao autenticado para submissao completa',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (
      !body.addressLine1 ||
      !body.city ||
      !body.state ||
      !body.postalCode ||
      !body.revenue
    ) {
      throw new HttpException(
        'addressLine1, city, state, postalCode e revenue são obrigatórios para submissão completa',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      !files?.idDocument?.length ||
      !files?.selfie?.length ||
      !files?.addressProof?.length ||
      !files?.revenueProof?.length
    ) {
      throw new HttpException(
        'idDocument, selfie, addressProof e revenueProof são obrigatórios',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.compliance.submitKycApplication(bodyWithUser, files);
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
