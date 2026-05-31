import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SorobanService } from '../chain/soroban.service';
import { WebhookService } from './webhook.service';

@Injectable()
export class StablecoinService {
  private readonly logger = new Logger(StablecoinService.name);
  private readonly STLT_CONTRACT_ID: string;
  private readonly MASTER_SECRET: string;

  constructor(
    private configService: ConfigService,
    private soroban: SorobanService,
    private webhooks: WebhookService,
  ) {
    this.STLT_CONTRACT_ID = this.configService.get<string>('STABLECOIN_CONTRACT_ID');
    this.MASTER_SECRET =
      this.configService.get<string>('MASTER_SECRET_KEY') ??
      this.configService.get<string>('STELLAR_SECRET_KEY');
  }

  /**
   * Processa um depósito via PIX e realiza o Minting do STLT-BRL equivalente.
   * Chamado pelo webhook de confirmação de recebimento (BaaS).
   */
  async handlePixDeposit(pixId: string, userAddress: string, amountBrl: number) {
    this.logger.log(`Processing PIX Deposit: ${pixId} for ${userAddress} - Amount: ${amountBrl} BRL`);

    try {
      // 1. Validar compliance (KYC) antes do mint
      const hasKyc = await this.soroban.hasValidVc(userAddress);
      if (!hasKyc) {
        this.logger.error(`User ${userAddress} has no valid KYC. Blocking mint.`);
        await this.webhooks.notifyComplianceIssue(userAddress, 'PIX_DEPOSIT_NO_KYC', { pixId, amountBrl });
        return { success: false, reason: 'KYC_REQUIRED' };
      }

      // 2. Executar Minting on-chain
      // Stellar usa 7 decimais (stroops)
      const amountStroops = (BigInt(amountBrl * 100) * BigInt(100000)).toString(); // BRL cents -> stroops
      
      const txHash = await this.soroban.executeContractCall(
        this.STLT_CONTRACT_ID,
        'mint',
        [
          // ScVal addresses and numbers should be properly formatted by the SDK
          // The SorobanService.executeContractCall handles some of this
        ],
        this.MASTER_SECRET
      );

      this.logger.log(`✅ Minting successful: ${txHash}`);
      
      return { success: true, txHash, amount: amountBrl };
    } catch (error) {
      this.logger.error(`Failed to process PIX deposit: ${error.message}`);
      throw error;
    }
  }

  /**
   * Realiza o resgate (Redeem) de STLT-BRL para PIX de saída.
   */
  async handleRedeem(userSecret: string, amountBrl: number, pixKey: string) {
    // 1. Burn tokens on-chain
    // 2. Trigger PIX transfer via BaaS API
    this.logger.log(`Processing Redeem: ${amountBrl} BRL to ${pixKey}`);
  }
}
