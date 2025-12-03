import { Body, Controller, Get, Patch, Post, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { WebAuthnAttestationDto } from './dto/webauthn-attestation.dto';
import { WebAuthnAssertionDto } from './dto/webauthn-assertion.dto';
import type { Request, Response } from 'express';
import { IssueNonceDto, VerifyWalletDto } from './dto/wallet.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterDto) {
    return await this.authService.register(body);
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    return await this.authService.login(body);
  }

  @Post('webauthn/attestation')
  @ApiOperation({ summary: 'Verificar attestation WebAuthn e registrar credential' })
  @ApiResponse({ status: 200, description: 'Credential registrado com sucesso' })
  async attestation(@Body() body: WebAuthnAttestationDto) {
    return this.authService.webauthnAttestation(body);
  }

  @Post('webauthn/assertion')
  @ApiOperation({ summary: 'Verificar assertion WebAuthn e emitir token' })
  @ApiResponse({ status: 200, description: 'Autenticação bem-sucedida' })
  async assertion(@Body() body: WebAuthnAssertionDto) {
    return this.authService.webauthnAssertion(body);
  }

  // ==============================
  // Wallet-based Auth (Freighter)
  // ==============================
  @Post('nonce')
  async nonce(@Body() body: IssueNonceDto) {
    const { pubkey } = body;
    return await this.authService.issueNonce(pubkey);
  }

  @Post('verify')
  async verify(
    @Body() body: VerifyWalletDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token, userId, pubkey } =
      await this.authService.verifyWalletSignature(body);
    // Set HttpOnly cookie; adjust attributes for prod as needed
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProd, // em dev sem HTTPS, precisa ser false
      sameSite: isProd ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });
    return { ok: true, userId, pubkey };
  }

  // ==============================
  // Perfil autenticado via cookie HttpOnly 'token'
  // ==============================
  @Get('me')
  async me(@Req() req: Request) {
    const cookies = req.cookies as Record<string, string> | undefined;
    let token: string | undefined = cookies?.token;
    // Suporte a Authorization: Bearer <token>
    if (!token && req.headers?.authorization) {
      const auth = req.headers.authorization as string;
      if (auth.toLowerCase().startsWith('bearer ')) {
        token = auth.substring(7);
      }
    }
    const { user } = await this.authService.meFromToken(token);
    return { user };
  }

  @Patch('me')
  async updateMe(
    @Req() req: Request,
    @Body()
    body: {
      name?: string | null;
      nickname?: string | null;
      phone?: string | null;
      dob?: string | null;
    },
  ) {
    const cookies = req.cookies as Record<string, string> | undefined;
    let token: string | undefined = cookies?.token;
    if (!token && req.headers?.authorization) {
      const auth = req.headers.authorization as string;
      if (auth.toLowerCase().startsWith('bearer ')) {
        token = auth.substring(7);
      }
    }
    const { user }: { user: User } = await this.authService.updateMe(
      token,
      body,
    );
    return { user } as { user: User };
  }

  // ==============================
  // Passkey (WebAuthn) - Production-ready
  // ==============================
  
  @Post('passkey/register/init')
  @ApiOperation({ summary: 'Inicializar registro de passkey' })
  @ApiResponse({ status: 200, description: 'Challenge e opções WebAuthn' })
  passkeyRegisterInit(@Body() body: { email: string }) {
    return this.authService.passkeyRegisterInit(body.email);
  }

  @Post('passkey/register/verify')
  @ApiOperation({ summary: 'Verificar e completar registro de passkey' })
  @ApiResponse({ status: 200, description: 'Passkey registrado com sucesso' })
  async passkeyRegisterVerify(
    @Body() body: { challenge: string; credential: any },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.passkeyRegisterVerify(body);
    
    // Se houver token, definir cookie
    if ('token' in result && result.token) {
      const isProd = process.env.NODE_ENV === 'production';
      res.cookie('token', result.token, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'strict' : 'lax',
        maxAge: 24 * 60 * 60 * 1000,
        path: '/',
      });
    }
    
    return result;
  }

  @Post('passkey/login/init')
  @ApiOperation({ summary: 'Inicializar login com passkey' })
  @ApiResponse({ status: 200, description: 'Challenge e opções de autenticação' })
  passkeyLoginInit(@Body() body: { email: string }) {
    return this.authService.passkeyLoginInit(body.email);
  }

  @Post('passkey/login/verify')
  @ApiOperation({ summary: 'Verificar assertion e autenticar usuário' })
  @ApiResponse({ status: 200, description: 'Login bem-sucedido' })
  async passkeyLoginVerify(
    @Body() body: { challenge: string; assertion: any },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token, userId, passkeyToken } = await this.authService.passkeyLoginVerify(body);
    
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });
    
    return { ok: true, userId, passkeyToken };
  }

  // ==============================
  // Email OTP - DEV
  // ==============================
  @Post('email/init')
  emailInit(@Body() body: { email: string }) {
    return this.authService.emailInit(body.email);
  }

  @Post('email/verify')
  async emailVerify(
    @Body() body: { email: string; code: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token, userId } = await this.authService.emailVerify(
      body.email,
      body.code,
    );
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });
    return { ok: true, token, userId };
  }
}
