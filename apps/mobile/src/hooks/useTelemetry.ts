import { useCallback } from 'react';
import { StellarWallet } from '../lib/stellar-wallet';
import { reportTelemetry } from '../lib/backend';

export type TelemetryEventType = 'BIO_SUCCESS' | 'BIO_FAILURE' | 'KYC_BLOCKED' | 'TRADE_START';

export function useTelemetry() {
  const reportEvent = useCallback(async (type: TelemetryEventType, metadata?: any) => {
    try {
      const userId = await StellarWallet.getPublicKey();
      await reportTelemetry({
        type,
        userId,
        status: 'reported',
        metadata: { ...metadata, timestamp: new Date().toISOString() },
      });
    } catch (error) {
      // Falha silenciosa para não quebrar a UX do usuário
      console.warn('[Telemetry] Failed to report event:', error);
    }
  }, []);

  return { reportEvent };
}
