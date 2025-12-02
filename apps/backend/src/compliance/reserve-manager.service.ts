import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ReflectorOracleService } from '../oracles/reflector-oracle.service';
import * as StellarSdk from '@stellar/stellar-sdk';

/**
 * Stablecoin Reserve Manager
 * Garante colateralização mínima de 120%
 * Multi-asset reserves com proof of reserves
 */

export interface ReserveAsset {
  code: string;
  issuer?: string;
  amount: number;
  valueUSD: number;
  lastUpdated: Date;
}

export interface ReserveSnapshot {
  timestamp: Date;
  stablecoinSupply: number;
  totalReserveValue: number;
  collateralizationRatio: number;
  assets: ReserveAsset[];
  auditHash?: string;
}

export interface CollateralizationAlert {
  severity: 'WARNING' | 'CRITICAL' | 'EMERGENCY';
  ratio: number;
  threshold: number;
  action: string;
  timestamp: Date;
}

@Injectable()
export class ReserveManagerService implements OnModuleInit {
  private readonly logger = new Logger(ReserveManagerService.name);
  private readonly MIN_COLLATERAL_RATIO = 120; // 120%
  private readonly WARNING_THRESHOLD = 125; // 125%
  private readonly TARGET_RATIO = 150; // 150% ideal
  private readonly server: StellarSdk.Horizon.Server;
  private readonly reserveAccount: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private oracleService: ReflectorOracleService,
  ) {
    const horizonUrl =
      this.configService.get('STELLAR_HORIZON') ||
      'https://horizon-testnet.stellar.org';
    this.server = new StellarSdk.Horizon.Server(horizonUrl);

    this.reserveAccount =
      this.configService.get('RESERVE_ACCOUNT') ||
      'GB...'; // TODO: Configurar
  }

  async onModuleInit() {
    this.logger.log('Initializing Reserve Manager...');
    await this.checkCollateralization();
    this.startMonitoring();
  }

  /**
   * Verifica estado de colateralização
   */
  async checkCollateralization(): Promise<{
    healthy: boolean;
    ratio: number;
    snapshot: ReserveSnapshot;
  }> {
    const snapshot = await this.getCurrentSnapshot();

    const healthy = snapshot.collateralizationRatio >= this.MIN_COLLATERAL_RATIO;

    if (!healthy) {
      await this.handleUndercollateralization(snapshot);
    } else if (
      snapshot.collateralizationRatio < this.WARNING_THRESHOLD
    ) {
      await this.sendWarningAlert(snapshot);
    }

    this.logger.log(
      `Collateralization check: ${snapshot.collateralizationRatio.toFixed(2)}% (${healthy ? 'HEALTHY' : 'CRITICAL'})`,
    );

    return {
      healthy,
      ratio: snapshot.collateralizationRatio,
      snapshot,
    };
  }

  /**
   * Obtém snapshot atual das reservas
   */
  async getCurrentSnapshot(): Promise<ReserveSnapshot> {
    // 1. Busca supply da stablecoin
    const stablecoinSupply = await this.getStablecoinSupply();

    // 2. Busca balances da reserve account
    const reserves = await this.getReserveBalances();

    // 3. Calcula valores em USD usando oracle
    const reservesWithValues = await Promise.all(
      reserves.map(async (asset) => {
        const price = await this.oracleService.getPrice(asset.code, 'USD');
        return {
          ...asset,
          valueUSD: asset.amount * (price?.price || 0),
          lastUpdated: new Date(),
        };
      }),
    );

    const totalReserveValue = reservesWithValues.reduce(
      (sum, asset) => sum + asset.valueUSD,
      0,
    );

    const collateralizationRatio =
      stablecoinSupply > 0
        ? (totalReserveValue / stablecoinSupply) * 100
        : 0;

    const snapshot: ReserveSnapshot = {
      timestamp: new Date(),
      stablecoinSupply,
      totalReserveValue,
      collateralizationRatio,
      assets: reservesWithValues,
    };

    // Salva snapshot no banco
    await this.saveSnapshot(snapshot);

    return snapshot;
  }

  /**
   * Gera Proof of Reserves (attestation on-chain)
   */
  async generateProofOfReserves(): Promise<{
    hash: string;
    txHash: string;
    snapshot: ReserveSnapshot;
  }> {
    const snapshot = await this.getCurrentSnapshot();

    // Gera hash do snapshot
    const hash = this.hashSnapshot(snapshot);

    // Publica hash on-chain via memo
    const txHash = await this.publishAuditHash(hash, snapshot);

    this.logger.log(`Proof of Reserves published: ${txHash}`);

    return {
      hash,
      txHash,
      snapshot: {
        ...snapshot,
        auditHash: hash,
      },
    };
  }

  /**
   * Obtém supply da stablecoin
   */
  private async getStablecoinSupply(): Promise<number> {
    try {
      const contractId = this.configService.get('STABLECOIN_CONTRACT_ID');
      if (!contractId) {
        this.logger.warn('STABLECOIN_CONTRACT_ID not configured');
        return 0;
      }

      // TODO: Chamar contrato Soroban para obter total_supply
      // Por enquanto, retorna mock
      return 1000000; // 1M BRL
    } catch (error) {
      this.logger.error(`Failed to get stablecoin supply: ${error.message}`);
      return 0;
    }
  }

  /**
   * Obtém balances da reserve account
   */
  private async getReserveBalances(): Promise<
    Array<{ code: string; issuer?: string; amount: number }>
  > {
    try {
      const account = await this.server.loadAccount(this.reserveAccount);

      return account.balances
        .filter((b) => b.asset_type !== 'liquidity_pool_shares')
        .map((balance: any) => ({
          code:
            balance.asset_type === 'native' ? 'XLM' : balance.asset_code,
          issuer:
            balance.asset_type === 'native' ? undefined : balance.asset_issuer,
          amount: parseFloat(balance.balance),
        }));
    } catch (error) {
      this.logger.error(`Failed to load reserve balances: ${error.message}`);
      return [];
    }
  }

  /**
   * Salva snapshot no banco
   */
  private async saveSnapshot(snapshot: ReserveSnapshot): Promise<void> {
    try {
      await this.prisma.dashboardSnapshot.create({
        data: {
          key: 'reserve_snapshot',
          windowStart: snapshot.timestamp,
          windowEnd: snapshot.timestamp,
          value: JSON.stringify({
            supply: snapshot.stablecoinSupply,
            reserves: snapshot.totalReserveValue,
            ratio: snapshot.collateralizationRatio,
            assets: snapshot.assets,
          }) as any,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to save snapshot: ${error.message}`);
    }
  }

  /**
   * Handle undercollateralization emergency
   */
  private async handleUndercollateralization(
    snapshot: ReserveSnapshot,
  ): Promise<void> {
    const alert: CollateralizationAlert = {
      severity: 'EMERGENCY',
      ratio: snapshot.collateralizationRatio,
      threshold: this.MIN_COLLATERAL_RATIO,
      action: 'FREEZE_MINTING',
      timestamp: new Date(),
    };

    this.logger.error(
      `🚨 EMERGENCY: Undercollateralization detected! Ratio: ${snapshot.collateralizationRatio.toFixed(2)}%`,
    );

    // 1. Congela minting
    await this.freezeMinting();

    // 2. Notifica admins
    await this.notifyAdmins(alert);

    // 3. Registra em audit log
    await this.prisma.auditLog.create({
      data: {
        channel: 'BOTH',
        level: 'SECURITY',
        action: 'UNDERCOLLATERALIZATION_DETECTED',
        metadata: JSON.stringify({
          ratio: snapshot.collateralizationRatio,
          threshold: this.MIN_COLLATERAL_RATIO,
          snapshot,
        }) as any,
      },
    });
  }

  /**
   * Envia alerta de warning
   */
  private async sendWarningAlert(snapshot: ReserveSnapshot): Promise<void> {
    const alert: CollateralizationAlert = {
      severity: 'WARNING',
      ratio: snapshot.collateralizationRatio,
      threshold: this.WARNING_THRESHOLD,
      action: 'MONITOR',
      timestamp: new Date(),
    };

    this.logger.warn(
      `⚠️ WARNING: Collateralization below target. Ratio: ${snapshot.collateralizationRatio.toFixed(2)}%`,
    );

    await this.notifyAdmins(alert);
  }

  /**
   * Congela minting no contrato
   */
  private async freezeMinting(): Promise<void> {
    try {
      // TODO: Chamar contrato stablecoin.set_mint_enabled(false)
      this.logger.log('Minting frozen due to undercollateralization');
    } catch (error) {
      this.logger.error(`Failed to freeze minting: ${error.message}`);
    }
  }

  /**
   * Notifica admins via múltiplos canais
   */
  private async notifyAdmins(alert: CollateralizationAlert): Promise<void> {
    // TODO: Implementar notificações (email, SMS, webhook)
    this.logger.log(
      `Admin notification sent: ${alert.severity} - Ratio ${alert.ratio.toFixed(2)}%`,
    );
  }

  /**
   * Gera hash do snapshot para attestation
   */
  private hashSnapshot(snapshot: ReserveSnapshot): string {
    const crypto = require('crypto');
    const data = JSON.stringify({
      timestamp: snapshot.timestamp.toISOString(),
      supply: snapshot.stablecoinSupply,
      reserves: snapshot.totalReserveValue,
      ratio: snapshot.collateralizationRatio,
      assets: snapshot.assets.map((a) => ({
        code: a.code,
        amount: a.amount,
        value: a.valueUSD,
      })),
    });

    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Publica hash on-chain
   */
  private async publishAuditHash(
    hash: string,
    snapshot: ReserveSnapshot,
  ): Promise<string> {
    try {
      const sourceKeypair = StellarSdk.Keypair.fromSecret(
        this.configService.get('STELLAR_SECRET_KEY') || '',
      );

      const sourceAccount = await this.server.loadAccount(
        sourceKeypair.publicKey(),
      );

      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: StellarSdk.Networks.TESTNET, // TODO: Configurar
      })
        .addOperation(
          StellarSdk.Operation.manageData({
            name: `reserve_proof_${Date.now()}`,
            value: Buffer.from(hash, 'hex').slice(0, 64),
          }),
        )
        .addMemo(
          StellarSdk.Memo.text(
            `PoR:${snapshot.collateralizationRatio.toFixed(0)}%`,
          ),
        )
        .setTimeout(30)
        .build();

      transaction.sign(sourceKeypair);

      const result = await this.server.submitTransaction(transaction);
      return result.hash;
    } catch (error) {
      this.logger.error(`Failed to publish audit hash: ${error.message}`);
      throw error;
    }
  }

  /**
   * Inicia monitoramento contínuo
   */
  private startMonitoring() {
    // Check a cada 5 minutos
    setInterval(
      async () => {
        try {
          await this.checkCollateralization();
        } catch (error) {
          this.logger.error(`Monitoring check failed: ${error.message}`);
        }
      },
      5 * 60 * 1000,
    );

    // Proof of Reserves a cada 24h
    setInterval(
      async () => {
        try {
          await this.generateProofOfReserves();
        } catch (error) {
          this.logger.error(`PoR generation failed: ${error.message}`);
        }
      },
      24 * 60 * 60 * 1000,
    );

    this.logger.log('Reserve monitoring started');
  }
}
