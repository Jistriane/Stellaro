import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PasskeyService } from '../passkey/passkey.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';

// Ed25519 verification helpers
import nacl from 'tweetnacl';
import * as StellarSdk from '@stellar/stellar-sdk';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly passkeyService: PasskeyService,
  ) {}

  // In-memory stores apenas para email OTP (mantido para dev)
  private emailCodes = new Map<string, { code: string; issuedAt: number }>();

  async register(data: RegisterDto) {
    const user = await this.prisma.user.upsert({
      where: { email: data.email },
      create: { email: data.email, name: data.name ?? null },
      update: { name: data.name ?? null },
    });
    
    // Inicializar registro WebAuthn usando PasskeyService
    const passkeyOptions = await this.passkeyService.initRegistration(
      user.id,
      user.email,
    );
    
    return { 
      user,
      passkeyOptions, // challenge, rpId, user info para WebAuthn
    };
  }

  async login(data: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (!user) throw new NotFoundException('User not found');
    const token = await this.jwt.signAsync({ sub: user.id, email: user.email });
    return { user, token };
  }

  /**
   * Verifica attestation WebAuthn e armazena credential
   */
  async webauthnAttestation(payload: {
    challenge: string;
    credential: any;
  }) {
    const result = await this.passkeyService.verifyRegistration(payload);
    
    if (!result.ok) {
      throw new UnauthorizedException(result.error || 'Registration verification failed');
    }
    
    return { 
      ok: true,
      message: 'Passkey registered successfully',
    };
  }

  /**
   * Verifica assertion WebAuthn e emite session/JWT
   */
  async webauthnAssertion(payload: {
    challenge: string;
    assertion: any;
  }) {
    const result = await this.passkeyService.verifyLogin(payload);
    
    if (!result.ok) {
      throw new UnauthorizedException(result.error || 'Authentication failed');
    }
    
    // Emitir JWT padrão da aplicação
    const user = await this.prisma.user.findUnique({
      where: { id: result.userId },
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    const appToken = await this.jwt.signAsync({ 
      sub: user.id, 
      email: user.email,
    });
    
    return { 
      ok: true,
      token: appToken,
      passkeyToken: result.token, // Session token do passkey
      user,
    };
  }

  // ==============================
  // Wallet-based Auth (Freighter)
  // ==============================

  async issueNonce(pubkey: string) {
    if (!pubkey) throw new UnauthorizedException('Missing pubkey');
    // Short-lived JWT as nonce bound to pubkey
    const jti = crypto.randomBytes(8).toString('hex');
    const nonce = await this.jwt.signAsync(
      { sub: pubkey, kind: 'wallet_nonce' },
      { expiresIn: '5m', jwtid: jti },
    );
    return { nonce };
  }

  async verifyWalletSignature(params: {
    pubkey: string;
    nonce: string;
    signature: string;
    provider?: string;
  }) {
    const { pubkey, nonce, signature, provider } = params;
    if (!pubkey || !nonce || !signature)
      throw new UnauthorizedException('Missing params');

    // 1) Verify nonce token is valid and belongs to pubkey
    type NoncePayload = { sub: string; kind: string; [k: string]: unknown };
    let decoded: NoncePayload;
    try {
      decoded = await this.jwt.verifyAsync<NoncePayload>(nonce);
    } catch {
      throw new UnauthorizedException('Invalid or expired nonce');
    }
    if (decoded.sub !== pubkey || decoded.kind !== 'wallet_nonce') {
      throw new UnauthorizedException('Nonce does not match pubkey');
    }

    // 2) Verify ed25519 signature (Freighter) of the raw nonce string
    let rawPub: Uint8Array;
    try {
      rawPub = StellarSdk.StrKey.decodeEd25519PublicKey(pubkey);
    } catch {
      throw new UnauthorizedException('Invalid pubkey');
    }
    const msg = new TextEncoder().encode(nonce);
    // Aceita assinatura em base64 (padrão Freighter) ou hex (algumas libs)
    let sigBuf: Buffer | undefined;
    try {
      sigBuf = Buffer.from(signature, 'base64');
      if (sigBuf.length !== 64) {
        // tentativa alternativa: hex puro (128 chars)
        const maybeHex = signature.trim().toLowerCase();
        if (/^[0-9a-f]+$/.test(maybeHex) && maybeHex.length === 128) {
          sigBuf = Buffer.from(maybeHex, 'hex');
        }
      }
    } catch {
      // fallback final: hex
      const maybeHex = signature.trim().toLowerCase();
      if (/^[0-9a-f]+$/.test(maybeHex) && maybeHex.length === 128) {
        sigBuf = Buffer.from(maybeHex, 'hex');
      }
    }
    if (!sigBuf || sigBuf.length !== 64)
      throw new UnauthorizedException('Invalid signature encoding');
    const ok = nacl.sign.detached.verify(msg, new Uint8Array(sigBuf), rawPub);
    if (!ok) throw new UnauthorizedException('Invalid signature');

    // 3) Upsert user by wallet and return user id
    // Strategy: find wallet -> user; if not, create user placeholder
    let wallet = await this.prisma.wallet.findUnique({
      where: { address: pubkey },
    });
    let userId: string;
    if (!wallet) {
      const user = await this.prisma.user.create({
        data: { email: `${pubkey.toLowerCase()}@wallet.local` },
      });
      wallet = await this.prisma.wallet.create({
        data: {
          userId: user.id,
          address: pubkey,
          provider: provider?.toLowerCase() || 'freighter',
          network: 'testnet',
        },
      });
      userId = user.id;
    } else {
      userId = wallet.userId;
    }

    // 4) Issue auth token (normal app JWT)
    const token = await this.jwt.signAsync({ sub: userId, wallet: pubkey });
    return { token, userId, pubkey };
  }

  // ==============================
  // Perfil a partir do token
  // ==============================
  async meFromToken(token?: string) {
    if (!token) throw new UnauthorizedException('Missing token');
    type AuthPayload = { sub?: string; [k: string]: unknown };
    let payload: AuthPayload;
    try {
      payload = await this.jwt.verifyAsync<AuthPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
    const userId: string | undefined = payload.sub;
    if (!userId) throw new UnauthorizedException('Invalid token payload');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return { user };
  }

  // Atualiza perfil autenticado (apenas campos suportados pelo schema)
  async updateMe(
    token: string | undefined,
    body: {
      name?: string | null;
    },
  ) {
    if (!token) throw new UnauthorizedException('Missing token');
    type AuthPayload = { sub?: string };
    let payload: AuthPayload;
    try {
      payload = await this.jwt.verifyAsync<AuthPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
    const userId = payload.sub;
    if (!userId) throw new UnauthorizedException('Invalid token payload');

    const data: { name?: string | null } = {};
    if (typeof body.name !== 'undefined') data.name = body.name;

    const user = await this.prisma.user.update({ where: { id: userId }, data });
    return { user };
  }

  // ==============================
  // Passkey (WebAuthn) - Production-ready flow
  // ==============================
  
  /**
   * Inicializa registro de passkey
   */
  async passkeyRegisterInit(email: string) {
    if (!email) throw new UnauthorizedException('Missing email');
    
    // Criar ou buscar usuário
    const user = await this.prisma.user.upsert({
      where: { email },
      create: { email },
      update: {},
    });
    
    // Delegar ao PasskeyService
    const options = await this.passkeyService.initRegistration(user.id, email);
    return options;
  }

  /**
   * Verifica e completa registro de passkey
   */
  async passkeyRegisterVerify(payload: {
    challenge: string;
    credential: any;
  }) {
    const result = await this.passkeyService.verifyRegistration(payload);
    
    if (!result.ok) {
      throw new UnauthorizedException(result.error || 'Registration failed');
    }
    
    // Buscar usuário associado ao challenge (via Redis)
    // Como o PasskeyService já salvou o passkey, podemos emitir token
    // Nota: idealmente pegamos userId do cache do challenge
    return { 
      ok: true,
      message: 'Passkey registered successfully',
    };
  }

  /**
   * Inicializa login com passkey
   */
  async passkeyLoginInit(email: string) {
    if (!email) throw new UnauthorizedException('Missing email');
    
    const result = await this.passkeyService.initLogin(email);
    
    if (!result.ok) {
      throw new NotFoundException(result.error || 'User not found');
    }
    
    return {
      ok: true,
      challenge: result.challenge,
      allowCredentials: result.allowCredentials,
    };
  }

  /**
   * Verifica assertion e emite token
   */
  async passkeyLoginVerify(payload: {
    challenge: string;
    assertion: any;
  }) {
    const result = await this.passkeyService.verifyLogin(payload);
    
    if (!result.ok) {
      throw new UnauthorizedException(result.error || 'Login failed');
    }
    
    // Buscar usuário
    const user = await this.prisma.user.findUnique({
      where: { id: result.userId },
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    // Emitir JWT padrão da aplicação
    const appToken = await this.jwt.signAsync({ 
      sub: user.id, 
      email: user.email,
    });
    
    return { 
      ok: true,
      token: appToken,
      userId: user.id,
      passkeyToken: result.token, // Session token do passkey para operações privilegiadas
    };
  }

  // ==============================
  // Email OTP (DEV)
  // ==============================
  emailInit(email: string) {
    if (!email) throw new UnauthorizedException('Missing email');
    const code = (Math.floor(Math.random() * 900000) + 100000).toString();
    this.emailCodes.set(email.toLowerCase(), { code, issuedAt: Date.now() });
    // In dev, return the code; in prod, send via provider
    return { ok: true, code };
  }

  async emailVerify(email: string, code: string) {
    if (!email || !code) throw new UnauthorizedException('Missing email or code');
    const entry = this.emailCodes.get(email.toLowerCase());
    if (!entry || entry.code !== code) throw new UnauthorizedException('Invalid code');
    this.emailCodes.delete(email.toLowerCase());
    const user = await this.prisma.user.upsert({
      where: { email },
      create: { email },
      update: {},
    });
    const token = await this.jwt.signAsync({ sub: user.id, email: user.email });
    return { ok: true, token, userId: user.id };
  }
}
