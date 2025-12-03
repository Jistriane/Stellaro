import { Injectable, Logger } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

function b64url(input: Buffer | string) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

@Injectable()
export class PasskeyService {
  private readonly logger = new Logger(PasskeyService.name);
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  private async getKit(): Promise<any | null> {
    try {
      return require('passkey-kit');
    } catch {
      this.logger.warn('passkey-kit não instalado; usando validação mínima.');
      return null;
    }
  }

  // ========== Registration ==========
  async initRegistration(userId: string, email: string) {
    const challenge = b64url(randomBytes(32));
    await this.redis.set(`pk:reg:${challenge}`, { userId, email }, 300);
    return { challenge, rpId: 'localhost', user: { id: userId, name: email } };
  }

  async verifyRegistration(payload: any) {
    const { challenge, credential } = payload || {};
    const cached = await this.redis.get<{ userId: string; email: string }>(
      `pk:reg:${challenge}`,
    );
    if (!cached) return { ok: false, error: 'registration_challenge_expired' };

    const kit = await this.getKit();
    let verified = true;
    let transports: string[] | undefined;
    let signCount = 0;
    let credentialId: string;
    let publicKeyB64: string;

    try {
      if (kit?.verifyRegistration) {
        const result = await kit.verifyRegistration({
          credential,
          expectedChallenge: challenge,
        });
        verified = !!result?.verified;
        transports = result?.credential?.transports;
        signCount = result?.credential?.signCount ?? 0;
        credentialId = result?.credential?.id;
        publicKeyB64 = result?.credential?.publicKey;
      } else {
        // fallback: confiar nos campos mínimos
        credentialId = credential?.id;
        publicKeyB64 = credential?.publicKey;
        signCount = credential?.signCount ?? 0;
        transports = credential?.transports;
      }
    } catch (e) {
      return {
        ok: false,
        error: `registration_verify_failed: ${(e as Error).message}`,
      };
    }

    if (!verified || !credentialId || !publicKeyB64)
      return { ok: false, error: 'invalid_credential' };

    await this.prisma.passkey.create({
      data: {
        userId: cached.userId,
        credentialId,
        publicKey: Buffer.from(publicKeyB64, 'base64'),
        signCount,
        transports: transports?.join(',') ?? null,
      },
    });

    return { ok: true };
  }

  // ========== Authentication ==========
  async initLogin(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return { ok: false, error: 'user_not_found' };
    const challenge = b64url(randomBytes(32));
    await this.redis.set(`pk:auth:${challenge}`, { userId: user.id }, 300);
    return { ok: true, challenge, allowCredentials: [] };
  }

  async verifyLogin(payload: any) {
    const { challenge, assertion } = payload || {};
    const cached = await this.redis.get<{ userId: string }>(
      `pk:auth:${challenge}`,
    );
    if (!cached) return { ok: false, error: 'auth_challenge_expired' };

    const kit = await this.getKit();
    try {
      if (kit?.verifyAuthentication) {
        const result = await kit.verifyAuthentication({
          assertion,
          expectedChallenge: challenge,
        });
        if (!result?.verified)
          return { ok: false, error: 'auth_verify_failed' };
      }
    } catch (e) {
      return {
        ok: false,
        error: `auth_verify_failed: ${(e as Error).message}`,
      };
    }

    const token = b64url(randomBytes(32));
    const userId = cached.userId;
    await this.redis.set(`sess:${token}`, { userId }, 3600);
    // indexar na lista do usuário para revogação
    const listKey = `sess:list:${userId}`;
    const list = (await this.redis.get<string[]>(listKey)) || [];
    list.push(token);
    await this.redis.set(listKey, list, 3600);
    return { ok: true, token, userId, exp: Date.now() + 3600 * 1000 };
  }

  // ========== Transaction Signing ==========
  async initTx(userId: string, memo?: string) {
    const nonce = b64url(randomBytes(16));
    const exp = Date.now() + 5 * 60 * 1000; // 5 min
    const challenge = b64url(
      createHash('sha256').update(`${userId}:${nonce}:${exp}`).digest(),
    );
    await this.redis.set(
      `pk:tx:${challenge}`,
      { userId, exp, memo: memo ?? null },
      300,
    );
    return { challenge, exp };
  }

  async verifyTx(payload: any) {
    const { challenge, signature } = payload || {};
    const cached = await this.redis.get<{ userId: string; exp: number }>(
      `pk:tx:${challenge}`,
    );
    if (!cached) return { ok: false, error: 'tx_challenge_expired' };
    if (cached.exp < Date.now())
      return { ok: false, error: 'tx_challenge_expired' };

    const kit = await this.getKit();
    try {
      if (kit?.verifyTransaction) {
        const result = await kit.verifyTransaction({ challenge, signature });
        if (!result?.verified) return { ok: false, error: 'tx_verify_failed' };
      }
    } catch (e) {
      return { ok: false, error: `tx_verify_failed: ${(e as Error).message}` };
    }

    return { ok: true, userId: cached.userId };
  }

  // ========== MFA fallback com carteira (assinatura de nonce) ==========
  async initMfa(userId: string) {
    const nonce = b64url(randomBytes(24));
    await this.redis.set(`mfa:nonce:${userId}`, { nonce }, 300);
    return { ok: true, nonce };
  }

  async verifyMfa(payload: any) {
    const { userId, publicKey, signature, nonce } = payload || {};
    if (!userId || !publicKey || !signature || !nonce)
      return { ok: false, error: 'missing_params' };
    const cached = await this.redis.get<{ nonce: string }>(
      `mfa:nonce:${userId}`,
    );
    if (!cached || cached.nonce !== nonce)
      return { ok: false, error: 'nonce_invalid' };

    try {
      // Import dinâmico do Stellar SDK

      const Stellar = require('@stellar/stellar-sdk');
      if (!Stellar.StrKey.isValidEd25519PublicKey(publicKey))
        return { ok: false, error: 'pubkey_invalid' };
      const kp = Stellar.Keypair.fromPublicKey(publicKey);
      const msg = Buffer.from(nonce);
      const sigBuf = Buffer.from(signature, 'base64');
      const verified = kp.verify(msg, sigBuf);
      if (!verified) return { ok: false, error: 'mfa_verify_failed' };
    } catch (e) {
      return { ok: false, error: `mfa_verify_failed: ${(e as Error).message}` };
    }

    const now = Date.now();
    const exp = now + 900 * 1000;
    await this.redis.set(`mfa:ok:${userId}`, { ok: true, ts: now, exp }, 900);
    return { ok: true, exp };
  }

  // ========== Revogação de sessões ==========
  async revokeUserSessions(userId: string) {
    const listKey = `sess:list:${userId}`;
    const list = (await this.redis.get<string[]>(listKey)) || [];
    if (list.length) await this.redis.mDel(list.map((t) => `sess:${t}`));
    await this.redis.del(listKey);
    return { ok: true, revoked: list.length };
  }

  // ========== MFA status / clear ==========
  async getMfaStatus(userId: string) {
    const data = await this.redis.get<{
      ok: boolean;
      ts: number;
      exp?: number;
    }>(`mfa:ok:${userId}`);
    if (!data?.ok) return { ok: false, remainingMs: 0 };
    const now = Date.now();
    const exp = data.exp ?? data.ts + 900 * 1000; // fallback caso exp não exista
    const remainingMs = Math.max(0, exp - now);
    return { ok: true, remainingMs, exp };
  }

  async clearMfa(userId: string) {
    await this.redis.del(`mfa:ok:${userId}`);
    return { ok: true };
  }
}
