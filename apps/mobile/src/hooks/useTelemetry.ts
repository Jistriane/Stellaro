import { useCallback } from 'react';
import { StellarWallet } from '../lib/stellar-wallet';

export type TelemetryEventType = 'BIO_SUCCESS' | 'BIO_FAILURE' | 'KYC_BLOCKED' | 'TRADE_START';

export function useTelemetry() {
  const reportEvent = useCallback(async (type: TelemetryEventType, metadata?: any) => {
    try {
      const userId = await StellarWallet.getPublicKey();
      
      // Em produção, a URL viria de uma variável de ambiente (.env)
      const BACKEND_URL = 'http://localhost:3001/v5/risk/telemetry';

      await fetch(BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          userId,
          status: 'reported',
          metadata,
          timestamp: new Date().toISOString(),
        }),
      });
      
      console.log(`[Telemetry] Reported ${type} for ${userId}`);
    } catch (error) {
      // Falha silenciosa para não quebrar a UX do usuário
      console.warn('[Telemetry] Failed to report event:', error);
    }
  }, []);

  return { reportEvent };
}
