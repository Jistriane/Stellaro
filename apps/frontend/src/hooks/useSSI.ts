import { useState, useEffect, useCallback } from 'react';

export interface SSICredential {
  id: string;
  type: string;
  issuer: string;
  status: string;
}

type UseSSIOptions = {
  walletAddress?: string | null;
  enabled?: boolean;
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function useSSI({ walletAddress, enabled = true }: UseSSIOptions = {}) {
  const [hasKyc, setHasKyc] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkKycStatus = useCallback(async () => {
    if (!enabled || !walletAddress) {
      setHasKyc(false);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      setError(null);
      const response = await fetch(`${apiUrl}/ssi/verify/${encodeURIComponent(walletAddress)}`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`SSI verify ${response.status}`);
      }

      const verified = (await response.json()) as boolean;
      setHasKyc(Boolean(verified));
    } catch (error) {
      console.error('Erro ao verificar status SSI:', error);
      setHasKyc(false);
      setError('Nao foi possivel validar o KYC da carteira conectada na testnet.');
    } finally {
      setIsLoading(false);
    }
  }, [enabled, walletAddress]);

  useEffect(() => {
    void checkKycStatus();
  }, [checkKycStatus]);

  return {
    hasKyc,
    isLoading,
    error,
    refreshKycStatus: checkKycStatus
  };
}
