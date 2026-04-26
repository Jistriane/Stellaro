import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  /**
   * Envia alertas para o usuário via canais externos (Telegram, WhatsApp, Push)
   */
  async sendAlert(userId: string, message: string, channel: 'telegram' | 'whatsapp' | 'all' = 'all') {
    this.logger.log(`[NotificationHub] Sending ${channel} alert to user ${userId}: "${message}"`);
    
    // Em produção: 
    // const user = await this.prisma.user.findUnique({ where: { id: userId } });
    // if (channel === 'telegram') await this.telegramBot.sendMessage(user.tgId, message);
    
    // Simulação de delay de rede
    await new Promise(resolve => setTimeout(resolve, 500));
    
    this.logger.log(`[NotificationHub] Alert delivered to user ${userId}.`);
  }

  async sendDangerZoneAlert(userId: string, healthFactor: number) {
    const message = `⚠️ ALERTA STELLARO: Seu Health Factor caiu para ${healthFactor.toFixed(2)}. Suas posições RWA estão em risco de liquidação. Por favor, adicione colateral ou reduza sua dívida.`;
    await this.sendAlert(userId, message, 'all');
  }
}
