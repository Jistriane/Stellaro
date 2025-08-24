import { Body, Controller, Get, Patch, Post, Req, Res } from '@nestjs/common';
import type { User } from '@prisma/client';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { Request, Response } from 'express';
import { IssueNonceDto, VerifyWalletDto } from './dto/wallet.dto';

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
  attestation() {
    return this.authService.webauthnAttestation();
  }

  @Post('webauthn/assertion')
  assertion() {
    return this.authService.webauthnAssertion();
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
    const token: string | undefined = cookies?.token;
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
    const token: string | undefined = cookies?.token;
    const { user }: { user: User } = await this.authService.updateMe(
      token,
      body,
    );
    return { user } as { user: User };
  }

  // ==============================
  // Passkey (WebAuthn) - DEV
  // ==============================
  @Post('passkey/register/init')
  passkeyRegisterInit(@Body() body: { email: string }) {
    return this.authService.passkeyRegisterInit(body.email);
  }

  @Post('passkey/register/verify')
  async passkeyRegisterVerify(
    @Body() body: { challenge: string; credential?: unknown },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token, userId } = await this.authService.passkeyRegisterVerify(
      body.challenge,
    );
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });
    return { ok: true, userId };
  }

  @Post('passkey/login/init')
  passkeyLoginInit(@Body() body: { email: string }) {
    return this.authService.passkeyLoginInit(body.email);
  }

  @Post('passkey/login/verify')
  async passkeyLoginVerify(
    @Body() body: { challenge: string; assertion?: unknown },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { token, userId } = await this.authService.passkeyLoginVerify(
      body.challenge,
    );
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });
    return { ok: true, userId };
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
    return { ok: true, userId };
  }
}
